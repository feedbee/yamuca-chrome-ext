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
        
        chrome.storage.sync.get({}, function(data) {
            chrome.tabs.sendMessage(sender.tab.id, {type: "credentials", credentials: data});
            if (!data.server || !data.key) {
                credentialsDefined = false;
                chrome.pageAction.setTitle({tabId: sender.tab.id, title: "This page can be remotely controlled by Yamuca. Click here to define credentials."});
            } else {
                credentialsDefined = true;
            }
        });
    }
    if (message.type == 'connecting') {
        chrome.pageAction.setTitle({tabId: sender.tab.id, title: "Yamuca: connecting..."});
    }
    if (message.type == 'connected') {
        chrome.pageAction.setTitle({tabId: sender.tab.id, title: "Yamuca: connected"});
    }
    if (message.type == 'disconnected') {
        chrome.pageAction.setTitle({tabId: sender.tab.id, title: "Yamuca: disconnected"});
    }
});

chrome.pageAction.onClicked.addListener(function (tab) {
    if (!credentialsDefined) {
        chrome.tabs.create({url: "chrome://extensions?options=" + chrome.runtime.id, "active": true});
    } else {
        chrome.tabs.sendMessage(tab.id, "page_action_clicked");
    }
});