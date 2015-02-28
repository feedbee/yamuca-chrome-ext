(function() {
    var YamucaInit = function () {
        var Yamuca = function (adapter) {
            this.togglePlay = adapter.togglePlay;
            this.next = adapter.next;
            this.previous = adapter.previous;
        };

        Yamuca.Adapters = {};
        Yamuca.Adapters.KeyPressEmulation = function () {
            var triggerKeyEvent = function (key, eventType) {
                var $document = $(document);
                var event = jQuery.Event(eventType);
                event.charCode = key;
                event.target = $document[0];
                event.type = eventType;
                $document.trigger(event);
            };
            var sendKeyPress = function (key) {
                triggerKeyEvent(key, "keypress");
                triggerKeyEvent(key, "keyup");
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
        };
        Yamuca.Adapters.UnityShim = function () {
            var sendActionEvent = function(action) {
                var evt = document.createEvent("CustomEvent");
                evt.initEvent("UnityActionEvent", true, true );
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
                ws,
                credentials;

            var connect = function () {
                if (!credentials) {
                    console.log('Yamuca: connections credentials are not set');
                    if (credentials === undefined) {
                        // retry in a second, if credentials are not yet set
                        setTimeout(function () {
                            connect();
                        }, 1000);
                    }
                    return;
                }

                chrome.extension.sendMessage("connecting");
                console.log('Yamuca: Trying to connect...');

                ws = new WebSocket(credentials.server);
                ws.onopen = function (e) {
                    connected = true;
                    chrome.extension.sendMessage("connected");
                    console.log('Yamuca: Connected');
                    ws.send(JSON.stringify({key: credentials.key}));
                    tries = 0;
                }

                ws.onerror = ws.close = function (e) {
                    connected = false;
                    chrome.extension.sendMessage("disconnected");
                    console.log('Yamuca: Error', e);
                    tries++;
                    if (tries < 5) {
                        setTimeout(connect, 1000);
                    } else {
                        tries = 0;
                        chrome.extension.sendMessage("giveup");
                        console.log('Yamuca: to many errors, giving up', e);
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
                        }
                    }
                };
            };

            var disconnect = function () {
                ws.disconnect();
            };

            this.connect = connect;
            this.disconnect = disconnect;
            this.isConnected = function () {
                return isConnected;
            }

            this.toggleConnectionState = function () {
                if (connected) {
                    disconnect();
                } else {
                    connect();
                }
            };

            this.setupCredentials = function (newCredentials) {
                credentials = newCredentials;
            };
        };

        window.Yamuca = new Yamuca(new Yamuca.Adapters.UnityShim());
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