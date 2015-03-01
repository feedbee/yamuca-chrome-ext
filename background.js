var credentialsDefined = false;
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
                credentialsDefined = false;
                chrome.tabs.sendMessage(sender.tab.id, {type: "credentials", credentials: null});
                chrome.pageAction.setTitle({tabId: sender.tab.id, title: "This page can be remotely controlled by Yamuca. Click here to define credentials."});
            } else {
                credentialsDefined = true;
                chrome.tabs.sendMessage(sender.tab.id, {type: "credentials", credentials: data});
                chrome.pageAction.setTitle({tabId: sender.tab.id, title: "This page can be remotely controlled by Yamuca. Click to connect to server."});
            }
        });
    }
    if (message.type == 'connecting') {
        chrome.pageAction.setTitle({tabId: sender.tab.id, title: "Yamuca: connecting..."});
    }
    if (message.type == 'connected') {
        chrome.pageAction.setTitle({tabId: sender.tab.id, title: "Yamuca: connected. Click to disconnect"});
    }
    if (message.type == 'disconnected') {
        chrome.pageAction.setTitle({tabId: sender.tab.id, title: "Yamuca: disconnected. Click to try to connect again"});
    }
});

chrome.pageAction.onClicked.addListener(function (tab) {
    if (!credentialsDefined) {
        chrome.tabs.create({url: "chrome://extensions?options=" + chrome.runtime.id, "active": true});
    } else {
        chrome.tabs.sendMessage(tab.id, "page_action_clicked");
    }
});