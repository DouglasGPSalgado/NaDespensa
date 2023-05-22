const express = require('express');
 mongoose = require('mongoose');

const app = express();

// Conexão com o banco de dados MongoDB
mongoose.connect('mongodb://localhost/estoque_de_alimentos', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Conexão com o MongoDB estabelecida com sucesso!'))
  .catch(err => console.log('Erro ao conectar com o MongoDB: ', err));

// Definição do schema do alimento
const foodSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  quantidade: { type: Number, required: true },
  dataDeValidade: { type: Date, required: true }
});

// Definição do modelo do alimento
const Food = mongoose.model('Food', foodSchema);

// Middleware para permitir o uso de JSON no corpo das requisições
app.use(express.json());

// Endpoint para criar um novo alimento
app.post('/foods', async (req, res) => {
  try {
    const food = new Food(req.body);
    await food.save();
    res.status(201).send(food);
  } catch (err) {
    res.status(400).send(err);
  }
});

// Endpoint para atualizar um alimento existente
app.put('/foods/:id', async (req, res) => {
  try {
    const food = await Food.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!food) {
      return res.status(404).send();
    }
    res.send(food);
  } catch (err) {
    res.status(400).send(err);
  }
});

// Endpoint para excluir um alimento
app.delete('/foods/:id', async (req, res) => {
  try {
    const food = await Food.findByIdAndDelete(req.params.id);
    if (!food) {
      return res.status(404).send();
    }
    res.send(food);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Endpoint para listar todos os alimentos
app.get('/foods', async (req, res) => {
  try {
    const foods = await Food.find();
    res.send(foods);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Endpoint para buscar um alimento por ID
app.get('/foods/:id', async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) {
      return res.status(404).send();
    }
    res.send(food);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Endpoint para buscar alimentos por nome
app.get('/foods', async (req, res) => {
  try {
    const foods = await Food.find({ nome: req.query.nome, quantidade: { $gt: 0 }, dataDeValidade: { $gte: new Date() } });
    res.send(foods);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Inicialização do servidor
app.listen(3000, () => {
  console.log('Servidor iniciado na porta 3000');
});
