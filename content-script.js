(function() {
    var YamucaInit = function () {
        var Yamuca = function (adapter) {
            var noHandled = function () {};
            this.togglePlay = adapter.togglePlay || noHandled;
            this.next = adapter.next || noHandled;
            this.previous = adapter.previous || noHandled;

            this.volumeUp = adapter.volumeUp || noHandled;
            this.volumeDown = adapter.volumeDown || noHandled;
            this.mute = adapter.mute || noHandled;
        };

        Yamuca.Adapters = {};
        Yamuca.Adapters.KeyPressSimulation = function () {

            // Inject keyboard event triggers into page context
            // (it doesn't work properly from extension context)
            var e = document.createElement('script');
            e.src = 'chrome-extension://' + chrome.runtime.id + '/embedded-key-events.js';
            document.body.appendChild(e);

            var sendKeyPress = function (key) {
                var evt = document.createEvent("CustomEvent");
                evt.initEvent("SendKeyEvents", true, true);
                evt.detail = key;
                document.body.setAttribute('data-yamuca-key', key);
                document.body.dispatchEvent(evt);
            };

            this.togglePlay = function () {
                sendKeyPress(112); // p
            };
            this.next = function () {
                sendKeyPress(107); // k
            };
            this.previous = function () {
                sendKeyPress(108); // l
            };
            this.volumeUp = function () {
                sendKeyPress(43); // +
            };
            this.volumeDown = function () {
                sendKeyPress(95); // -
            };
            this.mute = function () {
                sendKeyPress(48); // 0
            };
        };
        Yamuca.Adapters.UnityShim = function () {
            var sendActionEvent = function(action) {
                var evt = document.createEvent("CustomEvent");
                evt.initEvent("UnityActionEvent", true, true);
                evt.detail = action;
                document.body.setAttribute('data-unity-action', JSON.stringify(action));
                document.body.dispatchEvent(evt);
            };

            this.togglePlay = function () {
                sendActionEvent('pause');
            };
            this.next = function () {
                sendActionEvent('next');
            };
            this.previous = function () {
                sendActionEvent('previous');
            };
        };

        Yamuca.Controllers = {};
        Yamuca.Controllers.WebSocket = function (Yamuca) {
            var tries = 0,
                isConnected = false,
                isConnecting = false,
                stopRetrying = false,
                ws,
                timeout,
                credentials;

            var connect = function (isReconnect) {
                isConnecting = true;
                if (!isReconnect) {
                    stopRetrying = false;
                    tries = 0;
                }

                if (!credentials) {
                    console.log('Yamuca: connections credentials are not set');
                    if (credentials === undefined) {
                        // retry in a second, if credentials are not yet set
                        timeout = setTimeout(function () {
                            connect();
                        }, 1000);
                    }
                    return;
                }

                if (!isReconnect) {
                    chrome.extension.sendMessage("connecting");
                }
                console.log('Yamuca: Trying to connect...');

                ws = new WebSocket(credentials.server);
                ws.onopen = function (e) {
                    isConnecting = false;
                    isConnected = true;
                    chrome.extension.sendMessage("connected");
                    console.log('Yamuca: Connected');
                    ws.send(JSON.stringify({key: credentials.key}));
                }

                ws.onerror = ws.close = function (e) {
                    isConnecting = false;
                    isConnected = false;
                    if (!e) {
                        chrome.extension.sendMessage("disconnected");
                    }
                    console.log('Yamuca: Disconnected');

                    if (e) { // on error
                        console.log('Yamuca: Error', e);
                        tries++;
                        if (tries < 5 && !stopRetrying) {
                            timeout = setTimeout(function () { connect(true); }, 1000);
                        } else {
                            chrome.extension.sendMessage("disconnected");
                            if (stopRetrying) {
                                console.log('Yamuca: connection user canceled by user', e);
                            } else {
                                console.log('Yamuca: to many errors, giving up', e);
                            }
                        }
                    }
                };

                ws.onmessage = function (e) {
                    chrome.extension.sendMessage({type: "message_received", message: e.data});
                    console.log('Yamuca: Message received: ' + e.data);
                    var message = JSON.parse(e.data);
                    if (typeof(message) == 'object' && message.command != undefined) {
                        switch (message.command) {
                            case 'togglePlay': Yamuca.togglePlay(); break;
                            case 'next': Yamuca.next(); break;
                            case 'previous': Yamuca.previous(); break;
                            case 'volumeUp': Yamuca.volumeUp(); break;
                            case 'volumeDown': Yamuca.volumeDown(); break;
                            case 'mute': Yamuca.mute(); break;
                        }
                    }
                };
            };

            var disconnect = function () {
                ws.close();
            };

            this.connect = connect;
            this.disconnect = disconnect;
            this.isConnected = function () {
                return isConnected;
            }
            this.isConnecting = function () {
                return isConnecting;
            }

            this.toggleConnectionState = function () {
                if (isConnected) {
                    disconnect();
                } else if (isConnecting) {
                    stopRetrying = true;
                    clearTimeout(timeout);
                }  else {
                    connect();
                }
            };

            this.setupCredentials = function (newCredentials) {
                credentials = newCredentials;
            };
        };

        window.Yamuca = new Yamuca(new Yamuca.Adapters.KeyPressSimulation());
        window.YamucaController = new Yamuca.Controllers.WebSocket(window.Yamuca);

        chrome.extension.sendMessage("loaded");
        console.log('Yamuca loaded');

        chrome.runtime.onMessage.addListener(function (request, sender) {
            if (typeof(request) != "object") {
                var message = {type: request};
            } else {
                message = request;
            }

            if (message.type == 'page_action_clicked') {
                window.YamucaController.toggleConnectionState();
            }
            if (message.type == 'credentials') {
                window.YamucaController.setupCredentials(message.credentials);
                if (message.credentials !== null && message.credentials.autoconnect) {
                    window.YamucaController.connect();
                }
            }
        });
    };

    YamucaInit();
})();