var keepSwitchingIcon = false;
chrome.extension.onMessage.addListener(function (request, sender, callback) {
    console.log(request);
    if (typeof(request) != 'object')
    {
        var message = {type: request};
    } else {
        message = request;
    }

    if (message.type == 'loaded') {
        chrome.pageAction.show(sender.tab.id);
        chrome.pageAction.setTitle({tabId: sender.tab.id, title: "This page can be remotely controlled by Yamuca"});
        
        chrome.storage.sync.get([
            "server",
            "key",
            "autoconnect"
        ], function(data) {
            if (!data.server || !data.key) {
                chrome.storage.local.set({credentialsDefined: false});
                chrome.tabs.sendMessage(sender.tab.id, {type: "credentials", credentials: null});
                chrome.pageAction.setTitle({tabId: sender.tab.id, title: "This page can be remotely controlled by Yamuca. Click here to define credentials."});
            } else {
                chrome.storage.local.set({credentialsDefined: true});
                chrome.tabs.sendMessage(sender.tab.id, {type: "credentials", credentials: data});
                chrome.pageAction.setTitle({tabId: sender.tab.id, title: "This page can be remotely controlled by Yamuca. Click to connect to server."});
            }
        });
    } else if (message.type == 'connecting') {
        chrome.pageAction.setTitle({tabId: sender.tab.id, title: "Yamuca: connecting..."});
        chrome.pageAction.setIcon({tabId: sender.tab.id, path: {"19": "icons/icon-19-connect.png", "38": "icons/icon-38-connect.png"}});
        (function () {
            var index = "animateIcon" + sender.tab.id;

            var frameIndex = 0;
            var frameImages = [
                {"19": "icons/icon-19.png", "38": "icons/icon-38.png"},
                {"19": "icons/icon-19-connect.png", "38": "icons/icon-38-connect.png"}
            ];

            var rotateIcon = function ()
            {
                chrome.storage.local.get([index], function (data) {
                    if (data[index])
                    {
                        chrome.pageAction.setIcon({tabId: sender.tab.id, path: frameImages[frameIndex]});
                        frameIndex = (frameIndex + 1) % frameImages.length;
                        window.setTimeout(rotateIcon, 400);
                    }
                });
            };

            var o = {};
            o[index] = true;
            chrome.storage.local.set(o, rotateIcon);
        })();
    } else if (message.type == 'connected') {
        chrome.storage.local.remove(["animateIcon" + sender.tab.id]);
        chrome.pageAction.setTitle({tabId: sender.tab.id, title: "Yamuca: connected. Click to disconnect"});
        chrome.pageAction.setIcon({tabId: sender.tab.id, path: {"19": "icons/icon-19.png", "38": "icons/icon-38.png"}});
    } else if (message.type == 'disconnected') {
        chrome.storage.local.remove(["animateIcon" + sender.tab.id]);
        chrome.pageAction.setTitle({tabId: sender.tab.id, title: "Yamuca: disconnected. Click to try to connect again"});
        chrome.pageAction.setIcon({tabId: sender.tab.id, path: {"19": "icons/icon-19-inactive.png", "38": "icons/icon-38-inactive.png"}});
    }
});

chrome.pageAction.onClicked.addListener(function (tab) {
    chrome.storage.local.get({credentialsDefined: false}, function (data) {
        if (!data.credentialsDefined) {
            chrome.tabs.create({url: "chrome://extensions?options=" + chrome.runtime.id, "active": true});
        } else {
            chrome.tabs.sendMessage(tab.id, "page_action_clicked");
        }
    });
});