# MEUROPA

App: https://raczib.github.io/meuropa/

Itinerario del viaje por Europa: vuelos, trenes, hoteles, auto y documentos, día por día.
Funciona sin internet después de abrirla una vez (se puede agregar a la pantalla de inicio).

El repositorio es público, así que el itinerario (`data.bin`) y los documentos (`docs/*.bin`)
están cifrados con AES-GCM. La app pide la contraseña una vez por teléfono y los descifra ahí.

## Actualizar el itinerario o los documentos

Los datos en claro no están en este repositorio: `trip.json` y la carpeta de documentos viven aparte.

```
MEUROPA_PASSWORD='...' node build.mjs <carpeta-con-trip.json> <carpeta-de-documentos>
```

`build.mjs` vuelve a cifrar todo y actualiza la versión de `sw.js` para que los teléfonos bajen el cambio.

`vendor/pdfjs` es [PDF.js](https://mozilla.github.io/pdf.js/) 3.11.174 (Apache-2.0), para ver los PDF sin internet.
