Yamuca
======

Yamuca is a Google Chrome browser extension for remote control over [Yandex.Music](http://music.yandex.ru/) player. It injects into Yandex.Music page to control the player and connects to special remote control server over [WebSockets](https://developer.mozilla.org/en/docs/WebSockets). WebSockets server is external interchangeable part for this extension. Currently implemented [PHP version](https://github.com/feedbee/yamuca-server-php) of the server.

Both Yamuca extension and some kind of client application should connect to the same server and use single unique and secure key for interaction. Client application can be as interchangeable as server application and as the extension, all three component are built independently. Simple client application (web page) is embedded in PHP server application and accessable [via GitHub](http://feedbee.github.io/yamuca-server-php/controller.html).

Get it running
--------------

1. First of all install Chrome extension to the browser where [Yandex.Music](http://music.yandex.ru/) website will be opened.
2. Then download, setup and run [PHP server application](https://github.com/feedbee/yamuca-server-php).
3. Setup the extension to connect to runned server. After the setup in extension options window will appear QR Code linked to client page. Navigate there you device, which you will use for remote control. Connect to server.
4. Open [Yandex.Music](http://music.yandex.ru/). Extension icon must appear in the Omnibox (in the right side of browser's address bar), it's title should be "Yamuca: connected". Launch some music.
5. Use Next, Prev, Play/Pause buttons on the client application to control player.

Author
------
Valera Leontyev (feedbee@gmail.com).
Send questions to this email. To report errors use [issues](https://github.com/feedbee/yamuca-server-php/issues).