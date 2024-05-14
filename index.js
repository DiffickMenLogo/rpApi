const express = require("express");
const app = express();
const cors = require('cors')
const { MongoClient, ObjectId } = require('mongodb')

const clientBot = new MongoClient("mongodb+srv://katya:diplom@cluster0.irw9m3x.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
  useUnifiedTopology: true

});

app.use(express.json())
app.use(cors())

app.get("/getUsers", async (req, res) => {
  try {
    const result = await clientBot
      .db("sample_mflix")
      .collection("users")
      .find({})
      .toArray();
    res.send(result);
  } catch (error) {
    console.log(error);
  }
});

app.get('/getUser', async (req, res) => { 
  try {
    const result = await clientBot
      .db("Recipes")
      .collection("users")
      .findOne({ _id: new ObjectId(req.query.id) });
    res.send(result);
  } catch (error) { 
    console.error(error);
    res.status(500).send('An error occurred while fetching user');
  }
})

app.post('/registerUser', async (req, res) => {
  try {
    //check if user already exists
    const user = await clientBot
      .db("Recipes")
      .collection("users")
      .findOne({ email: req.body.email });
    
    if (user) {
      return res.status(400).send('User already exists');
    } else {
      // If user doesn't exist, create a new user
      const creation = await clientBot
        .db("Recipes")
        .collection("users")
        .insertOne(req.body);
      
      const result = await clientBot
        .db("Recipes")
        .collection("recipes")
        .findOne({ _id: new ObjectId(creation.insertedId) }, { projection: { password: 0 } });
      
      return res.status(200).send(result);
    }

  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while registering user');
  }
})

app.post('/loginUser', async (req, res) => {
  try {
    //check if user already exists
    const user = await clientBot
      .db("Recipes")
      .collection("users")
      .findOne({ email: req.body.email });
    
    if (user) {
      if (user.password === req.body.password) {
        res.status(200).send({
          _id: user._id,
          email: user.email, 
        });
      } else {
        res.status(400).send('Invalid password');
      }
    } else {
      res.status(400).send('User not found');
    }

  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while logging in');
  }
})

app.get('/getRecipes', async (req, res) => { 
  try {
    console.log(req.query)
    const page = parseInt(req.query.page) || 1; // Получаем номер страницы из запроса или используем 1 по умолчанию
    const limit = parseInt(req.query.limit) || 10; // Получаем лимит из запроса или используем 10 по умолчанию
    const skip = (page - 1) * limit; // Рассчитываем смещение
    const time = req.query.time ? parseInt(req.query.time) : undefined;
    const calories = req.query.calories ? parseInt(req.query.calories) : undefined;
    const type = req.query.type || undefined;
    const coutIngridients = req.query.coutIngridients ? parseInt(req.query.coutIngridients) : undefined;
    const search = req.query.search || undefined;
    const ingredients = req.query.ingredients || undefined;


    console.log(skip, 'skip')

    // Создаем запрос с динамическими условиями
    const query = { $and: [] };

    // if (ingredients) {
    //     const arr = ingredients.split(',').map(ingredient => ingredient.trim()); // Разделяем строку на массив и убираем пробелы
    //     query.$and.push({
    //       'ingredients.name': { // Используем точечную нотацию для поиска по имени в объектах массива
    //         $all: {
    //           $in: arr
    //         } // Используем $in для проверки наличия всех ингредиентов
    //       }
    //     });
    // }

    if (ingredients) {
  const regexArr = ingredients.split(',')
    .map(ingredient => new RegExp(`^${ingredient.trim()}$`, 'i')); // Создаем регулярное выражение для каждого ингредиента

  query.$and.push({
    'ingredients.name': { // Используем точечную нотацию для поиска по имени в объектах массива
      $all: regexArr // Используем $all с массивом регулярных выражений для проверки наличия всех ингредиентов
    }
  });
  
}

    if (search) {
      query.$and.push({ name: { $regex: search, $options: 'i' } });
    }

    if (time) {

      query.$and.push({ time: { 
        $gte: time - 5,
        $lte: time 
      }});
      console.log(time, 'time')
    }
    if (calories) {
      query.$and.push({ calories: { $gte: calories } });
    }
    if (type) {
      query.$and.push({ type: type  });
    }

    if (coutIngridients) {
      query.$and.push({ ingredients_count: { $lte: coutIngridients } });
    } 

    // Если $and пустой, удаляем его из запроса
    if (query.$and.length === 0) {
      delete query.$and;
    }

    const result = await clientBot
      .db("Recipes")
      .collection("recipes")
      .find(query)
      .skip(skip)
      .limit(limit)
      .sort(coutIngridients ? {} : ingredients ? { ingredients_count: 1 } : { })
      .toArray();
    
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while fetching recipes');
  }
})

app.get('/recipesLength', async (req, res) => { 
  try {

    console.log(req.query, 'req.query length')

    const time = req.query.time ? parseInt(req.query.time) : undefined;
    const calories = req.query.calories ? parseInt(req.query.calories) : undefined;
    const type = req.query.type || undefined;
    const coutIngridients = req.query.coutIngridients ? parseInt(req.query.coutIngridients) : undefined;
    const search = req.query.search || undefined;
    const ingredients = req.query.ingredients || undefined;


      // Создаем запрос с динамическими условиями
    const query = { $and: [] };

    if (search) {
      query.$and.push({ name: { $regex: search, $options: 'i' } });
    }

            if (ingredients) {
  const regexArr = ingredients.split(',')
    .map(ingredient => new RegExp(`^${ingredient.trim()}$`, 'i')); // Создаем регулярное выражение для каждого ингредиента

  query.$and.push({
    'ingredients.name': { // Используем точечную нотацию для поиска по имени в объектах массива
      $all: regexArr // Используем $all с массивом регулярных выражений для проверки наличия всех ингредиентов
    }
  });
}

    if (time) {

      query.$and.push({ time: { 
        $gte: time - 5,
        $lte: time 
      }});
      console.log(time, 'time')
    }

    if (calories) {
      query.$and.push({ calories: { $gte: calories } });
    }
    if (type) {
      query.$and.push({ type: type  });
    }

    if (coutIngridients) {
      query.$and.push({ ingredients_count: { $lte: coutIngridients } });
    } 

    // Если $and пустой, удаляем его из запроса
    if (query.$and.length === 0) {
      delete query.$and;
    }

    const result = await clientBot
      .db("Recipes")
      .collection("recipes")
      .countDocuments(query);
    res.send({ count: result });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while fetching recipes count');
  }
});

app.get('/recipesTimes', async (req, res) => { 
  try {
    const result = await clientBot
      .db("Recipes")
      .collection("recipes")
      .distinct("time");
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while fetching recipes');
  }
})

app.get('/recipesTypes', async (req, res) => { 
  try {
    const result = await clientBot
      .db("Recipes")
      .collection("recipes")
      .distinct("type");
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while fetching recipes');
  }
})


app.get('/getRandomRecipes', async (req, res) => { 
  try {
    const result = await clientBot
      .db("Recipes")
      .collection("recipes")
      .aggregate([
        { $sample: { size: 3 } } // Случайно выбираем 3 документа
      ])
      .toArray();

    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while fetching random recipes');
  }
});


app.get('/getRecipe', async (req, res) => {
  try {
    const result = await clientBot
      .db("Recipes")
      .collection("recipes")
      .findOne({ _id: new ObjectId(req.query.id) });
    res.send(result);
  } catch (error) { 
    console.error(error);
    res.status(500).send('An error occurred while fetching recipe');
  }

})


app.post('/addFavorite', async (req, res) => { 
  try {
    const result = await clientBot
      .db("Recipes")
      .collection("users")
      .updateOne(
        { _id: new ObjectId(req.body.userId) },
        { $push: { favorites: req.body.recipe } }
      );
    res.status(200).send(result);
  } catch (error) { 
    console.error(error);
    res.status(500).send('An error occurred while fetching recipe');
  }
})


app.post('/deleteFavorite', async (req, res) => { 
  try {
    const result = await clientBot
      .db("Recipes")
      .collection("users")
      .updateOne(
        { _id: new ObjectId(req.body.userId) },
        { $pull: { favorites: req.body.recipe } }
      );
    res.status(200).send(result);
  } catch (error) { 
    console.error(error);
    res.status(500).send('An error occurred while fetching recipe');
  }
})

app.get('/getFavorites', async (req, res) => { 
  try {
    const result = await clientBot
      .db("Recipes")
      .collection("users")
      .findOne({ _id: new ObjectId(req.query.userId) });
    
    res.send(result?.favorites || []);
  } catch (error) { 
    console.error(error);
    res.status(500).send('An error occurred while fetching recipe');
  }
})




app.listen(3001, () => {
  console.log("Server started on port 3000");
});