// 1. Importar Express
const express = require('express');

// 2. Crear una instancia de la aplicación
const app = express();
const port = 3000; // Puedes elegir cualquier puerto libre

// 3. Definir una ruta simple (Endpoint)
app.get('/', (req, res) => {
  res.send('¡Hola, mundo! Este es mi primer servidor Express.');
});

// 4. Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor Express escuchando en http://localhost:${port}`);
});