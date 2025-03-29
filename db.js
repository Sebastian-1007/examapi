const mysql = require('mysql');

const connection = mysql.createConnection({
  host: 'database-2.c05ec0eoq3el.us-east-1.rds.amazonaws.com', // Endpoint de tu instancia RDS
  user: 'admin', // Usuario de la base de datos
  password: 'Base_0705', // Contraseña de la base de datos
  database: 'usuarios' // Nombre de la base de datos
});

connection.connect((err) => {
  if (err) {
    console.error('Error de conexión a la base de datos:', err);
    return;
  }
  console.log('Conexión a la base de datos exitosa');
});

module.exports = connection;