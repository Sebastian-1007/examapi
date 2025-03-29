require('dotenv').config();
const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
const connection = require('./db');
const bcrypt = require('bcryptjs');
const saltRounds = 10;

/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: Operaciones relacionadas con usuarios
 */

/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     summary: Obtener todos los usuarios
 *     tags: [Usuarios]
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_user:
 *                     type: integer
 *                   nombre:
 *                     type: string
 *                   email:
 *                     type: string
 *       500:
 *         description: Error del servidor
 */
router.get('/usuarios', (req, res) => {
  connection.query('SELECT id_user, nombre, email FROM user', (err, results) => {
    if (err) {
      console.error('Error al obtener registros:', err);
      res.status(500).json({ error: 'Error al obtener registros' });
      return;
    }
    res.json(results);
  });
});

/**
 * @swagger
 * /api/usuarios/{id}:
 *   get:
 *     summary: Obtener un usuario por ID
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Datos del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_user:
 *                   type: integer
 *                 nombre:
 *                   type: string
 *                 email:
 *                   type: string
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */
router.get('/usuarios/:id', (req, res) => {
  const id = req.params.id;
  connection.query('SELECT id_user, nombre, email FROM user WHERE id_user = ?', id, (err, results) => {
    if (err) {
      console.error('Error al obtener el registro:', err);
      res.status(500).json({ error: 'Error al obtener el registro' });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ error: 'Registro no encontrado' });
      return;
    }
    res.json(results[0]);
  });
});

/**
 * @swagger
 * /api/registro:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - email
 *               - contraseña
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Juan Pérez"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "juan@example.com"
 *               contraseña:
 *                 type: string
 *                 format: password
 *                 example: "MiContraseñaSegura123"
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 userId:
 *                   type: integer
 *       400:
 *         description: Datos faltantes o inválidos
 *       500:
 *         description: Error del servidor
 */
router.post('/registro', async (req, res) => {
  try {
    const { nombre, email, contraseña } = req.body;
    
    if (!nombre || !email || !contraseña) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const hashedPassword = await bcrypt.hash(contraseña, saltRounds);
    
    const nuevoUsuario = {
      nombre,
      email,
      contraseña: hashedPassword
    };

    connection.query('INSERT INTO user SET ?', nuevoUsuario, (err, results) => {
      if (err) {
        console.error('Error al crear usuario:', err);
        return res.status(500).json({ error: 'Error al crear usuario', details: err.message });
      }
      res.status(201).json({ 
        message: 'Usuario creado exitosamente',
        userId: results.insertId 
      });
    });
  } catch (error) {
    console.error('Error en el servidor:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - contraseña
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "juan@example.com"
 *               contraseña:
 *                 type: string
 *                 format: password
 *                 example: "MiContraseñaSegura123"
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nombre:
 *                       type: string
 *                     email:
 *                       type: string
 *       400:
 *         description: Datos faltantes
 *       401:
 *         description: Credenciales inválidas
 *       500:
 *         description: Error del servidor
 */
router.post('/login', async (req, res) => {
  try {
    const { email, contraseña } = req.body;
    
    if (!email || !contraseña) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    connection.query('SELECT * FROM user WHERE email = ?', [email], async (err, results) => {
      if (err) {
        console.error('Error al buscar usuario:', err);
        return res.status(500).json({ error: 'Error en el servidor' });
      }
      
      if (results.length === 0) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
      
      const usuario = results[0];
      
      const match = await bcrypt.compare(contraseña, usuario.contraseña);
      
      if (!match) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
      
      const userData = {
        id: usuario.id_user,
        nombre: usuario.nombre,
        email: usuario.email
      };
      
      res.json({ 
        message: 'Login exitoso',
        user: userData
      });
    });
  } catch (error) {
    console.error('Error en el servidor:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

/**
 * @swagger
 * /api/usuarios/{id}:
 *   put:
 *     summary: Actualizar un usuario
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Juan Pérez Modificado"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "juan.modificado@example.com"
 *               contraseña:
 *                 type: string
 *                 format: password
 *                 example: "NuevaContraseñaSegura123"
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error del servidor
 */
router.put('/usuarios/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { nombre, email, contraseña } = req.body;
    const datosActualizados = { nombre, email };
    
    if (contraseña) {
      datosActualizados.contraseña = await bcrypt.hash(contraseña, saltRounds);
    }
    
    connection.query('UPDATE user SET ? WHERE id_user = ?', [datosActualizados, id], (err, results) => {
      if (err) {
        console.error('Error al actualizar:', err);
        return res.status(500).json({ error: 'Error al actualizar' });
      }
      res.json({ message: 'Usuario actualizado exitosamente' });
    });
  } catch (error) {
    console.error('Error en el servidor:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

/**
 * @swagger
 * /api/usuarios/{id}:
 *   delete:
 *     summary: Eliminar un usuario
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario a eliminar
 *     responses:
 *       200:
 *         description: Usuario eliminado exitosamente
 *       500:
 *         description: Error del servidor
 */
router.delete('/usuarios/:id', (req, res) => {
  const id = req.params.id;
  connection.query('DELETE FROM user WHERE id_user = ?', id, (err, results) => {
    if (err) {
      console.error('Error al eliminar:', err);
      res.status(500).json({ error: 'Error al eliminar' });
      return;
    }
    res.json({ message: 'Usuario eliminado exitosamente' });
  });
});

module.exports = router;