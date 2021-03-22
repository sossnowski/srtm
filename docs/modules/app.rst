========================
**Main folder**
========================


**index.js**
--------------------

Index.js creates a http server and starts listening at specified port.

**app.js**
--------------------

This part of software uses Express framework to handle routing and requests.
Specifies header: Origin, X-Requested-With, Content-Type, Accept, Authorization.
Targets to /api/elevation/ folder.

**logger.js**
--------------------

.. autofunction:: logger( = winston.createLogger())
   