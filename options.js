(function () {
    // Saves options to chrome.storage.sync
    var save = function () {
        var server = document.getElementById('server').value;
        var key = document.getElementById('key').value;
        var autoconnect = document.getElementById('autoconnect').checked;

        chrome.storage.sync.set({
            server: server,
            key: key,
            autoconnect: autoconnect
        }, function() {
            // Update status to let user know othe result
            var status = document.getElementById('status');
            if (chrome.runtime.lastError) {
                status.textContent = chrome.i18n.getMessage("optionsNotSaved", [chrome.runtime.lastError]);
                setTimeout(function() {
                    status.textContent = '';
                }, 2000);
            } else {
                status.textContent = chrome.i18n.getMessage("optionsSaved");
                setTimeout(function() {
                    status.textContent = '';
                }, 1000);
            }

            updateQrCode();
        });
    };

    // Restores options from chrome.storage.sync
    var restore = function () {
        // Use default values
        chrome.storage.sync.get({
            server: '',
            key: '',
            autoconnect: false
        }, function(data) {
            document.getElementById('server').value = data.server;
            document.getElementById('key').value = data.key;
            document.getElementById('autoconnect').checked = data.autoconnect;
            updateQrCode();
        });
    };

    var generateRandomString = function (length)
    {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        return text;
    }

    var generateKey = function () {
        document.getElementById('key').value = generateRandomString(32);
    };

    var updateQrCode = function () {
        var server = document.getElementById('server').value.trim();
        var key = document.getElementById('key').value.trim();

        if (server == '' && key == '') {
            document.getElementById('qrcode-container').style.display = 'none';
        } else {
            var url = "http://feedbee.github.io/yamuca-server-php/controller.html?key="
                + key + "&server=" + server;

            var qrUrl = "https://api.qrserver.com/v1/create-qr-code/?data="
                + encodeURIComponent(url) + "&size=120x120";

            document.getElementById('client-link').href =  url;
            document.getElementById('qrcode').src = qrUrl;
            document.getElementById('qrcode-container').style.display = 'block';
        }
    };

    document.addEventListener('DOMContentLoaded', restore);
    document.getElementById('generate-key').addEventListener('click', generateKey);
    document.getElementById('save').addEventListener('click', save);
})();