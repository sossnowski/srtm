========================
**Elevation**
========================


**Controller**
--------------------

.. autofunction:: point
.. autofunction:: area

**Routes**
--------------------

Provides endpoints used in evaluation of an elevation.
We can distinguish two specific endpoints: '/point/:coordinates' and '/area/:distanceBetweenPoints'.
Choosing an endpoint results in invoking functions from elevationController.js (point() or area()).


**Service**
--------------------

.. autofunction:: pointFromCoordinates
.. autofunction:: getElevation
.. autofunction:: getPointsGridOfArea
.. autofunction:: getElevationsFromPointsGrid
.. autofunction:: getStatiticsDataFromElevationsArray
.. autofunction:: splitPolygon
