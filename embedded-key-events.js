// Used with Yamuca.Adapters.KeyPressSimulation, attached to document from content script
(function () {
    var triggerKeyEvent = function (keyCode, eventType) {
        var oEvent = document.createEvent('KeyboardEvent');

        // Chromium Hack
        Object.defineProperty(oEvent, 'keyCode', {
            get: function() {
                return this.keyCodeVal;
            }
        });
        Object.defineProperty(oEvent, 'which', {
            get: function() {
                return this.keyCodeVal;
            }
        });
        Object.defineProperty(oEvent, 'charCode', {
            get: function() {
                return this.keyCodeVal;
            }
        });

        oEvent.initKeyboardEvent(eventType, true, true, document.defaultView, false, false, false, '', keyCode, false);
        oEvent.keyCodeVal = keyCode;

        document.dispatchEvent(oEvent);
    };
    var sendKeyEventsPair = function (key) {
        triggerKeyEvent(key, "keypress");
        triggerKeyEvent(key, "keyup");
    };

    document.body.addEventListener('SendKeyEvents', function(e) {
        var key = parseInt(document.body.getAttribute('data-yamuca-key'));
        sendKeyEventsPair(key);
        document.body.removeAttribute('data-yamuca-key');
    });
})();