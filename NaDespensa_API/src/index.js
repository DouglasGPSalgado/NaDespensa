//imports
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
// Conexão com o banco de dados MongoDB
// mongoose
//   .connect("mongodb://localhost/estoque_de_alimentos", {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => console.log("Conexão com o MongoDB estabelecida com sucesso!"))
//   .catch((err) => console.log("Erro ao conectar com o MongoDB: ", err));

// Definição do schema do alimento
const foodSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  quantidade: { type: Number, required: true },
  dataDeValidade: { type: Date, required: true },
});

// Definição do modelo do alimento
const Food = mongoose.model("Food", foodSchema);

// Middleware para permitir o uso de JSON no corpo das requisições
app.use(express.json());

//Models
const User = require("./models/User");

// Endpoint para criar um novo alimento
app.post("/foods", async (req, res) => {
  try {
    const food = new Food(req.body);
    await food.save();
    res.status(201).send(food);
  } catch (err) {
    res.status(400).send(err);
  }
});

// Endpoint para atualizar um alimento existente
app.put("/foods/:id", async (req, res) => {
  try {
    const food = await Food.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!food) {
      return res.status(404).send();
    }
    res.send(food);
  } catch (err) {
    res.status(400).send(err);
  }
});

// Endpoint para excluir um alimento
app.delete("/foods/:id", async (req, res) => {
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
app.get("/foods", async (req, res) => {
  try {
    const foods = await Food.find();
    res.send(foods);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Endpoint para buscar um alimento por ID
app.get("/foods/:id", async (req, res) => {
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
app.get("/foods", async (req, res) => {
  try {
    const foods = await Food.find({
      nome: req.query.nome,
      quantidade: { $gt: 0 },
      dataDeValidade: { $gte: new Date() },
    });
    res.send(foods);
  } catch (err) {
    res.status(500).send(err);
  }
});

// DASDSADSADASDASDSADASDSADSADASDASDASDASDASDASDASDSADASDASDASDASDSADSADSAADSADASDSADSADASDSDAS

//Rota privada
app.get("/user/:id", checkToken, async (req, res) => {
  const id = req.params.id;

  //Checar se usuário existe
  const user = await User.findById(id, "-password");

  if (!user) {
    return res.status(404).json({ msg: "Usuário não encontrado" });
  }

  res.status(200).json({ user });
});

function checkToken(req, res, next){

  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(" ")[1]

  if(!token){ 
    return res.status(401).json({msg: 'Acesso negado!'})
  }
  try{
    const secret = process.env.SECRET

    jwt.verify(token, secret)
    
  } catch (error) {
    console.log(error);
    res.status(400).json({
      msg: "Token inválido!",
    });
  }
}

//Registrar Usuário
app.post("/auth/register", async (req, res) => {
  const { name, email, password, confirmpassword } = req.body;

  //validações
  if (!name) {
    return res.status(422).json({ msg: "O nome é obrigatório!" });
  }

  if (!email) {
    return res.status(422).json({ msg: "O email é obrigatório!" });
  }

  if (!password) {
    return res.status(422).json({ msg: "A senha é obrigatória!" });
  }

  if (password !== confirmpassword) {
    return res.status(422).json({ msg: "As senhas não conferem!" });
  }
  //Checar se um usuario existe
  const UserExists = await User.findOne({ email: email });

  if (UserExists) {
    return res.status(422).json({ msg: "Por favor, utilize outro e-mail!" });
  }

  //Criar senha
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  // create user
  const user = new User({
    name,
    email,
    password: passwordHash,
  });

  try {
    await user.save();

    res.status(201).json({ msg: "Usuario criado com sucesso!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: "Aconteceu um erro no servidor, tente novamente mais tarde",
    });
  }
});

//Logind de Usuário
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  //Validações
  if (!email) {
    return res.status(422).json({ msg: "O email é obrigatório!" });
  }

  if (!password) {
    return res.status(422).json({ msg: "A senha é obrigatória!" });
  }

  //Ver se o usuario existe
  const user = await User.findOne({ email: email });

  if (!user) {
    return res.status(422).json({ msg: "Usuário não encontrado!" });
  }

  //Ver se a senha bate
  const checkPassword = await bcrypt.compare(password, user.password);

  if (!checkPassword) {
    return res.status(422).json({ msg: "Senha inválida!" });
  }

  try {
    const secret = process.env.SECRET;

    const token = jwt.sign(
      {
        id: user._id,
      },
      secret
    );

    res.status(200).json({ msg: "Autenticação realizada com sucesso", token });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: "Aconteceu um erro no servidor, tente novamente mais tarde",
    });
  }
});

//Credenciais
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASS;

// Inicialização do servidor
mongoose
  .connect(
    `mongodb+srv://${dbUser}:${dbPassword}@cluster0.amk28ys.mongodb.net/AuthNaDespensa?retryWrites=true&w=majority`
  )
  .then(() => {
    app.listen(3000, () => {
      console.log("Conectou ao banco!");
    });
  })
  .catch((err) => console.log(err));
