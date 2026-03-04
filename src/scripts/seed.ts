// scripts/seed.ts

import mongoose from 'mongoose';
import Recipe from '../models/Recipe.model';
import dotenv from 'dotenv';

dotenv.config();

const recipes = [
  // DESAYUNOS (8 recetas)
  {
    title: "Huevos revueltos con espinacas",
    description: "Desayuno rápido, proteico y nutritivo. Ideal para empezar el día con energía.",
    imageUrl: "https://images.unsplash.com/photo-1551183053-bf91a1d81141",
    category: "desayuno",
    dietTypes: ["normal", "vegetarian"],
    allergens: ["huevo"],
    ingredients: [
      { name: "Huevo", quantity: 2, unit: "piezas", alternatives: ["tofu sedoso"] },
      { name: "Espinaca", quantity: 50, unit: "g", alternatives: ["acelga"] },
      { name: "Aceite de oliva", quantity: 10, unit: "ml", alternatives: ["aceite vegetal"] },
      { name: "Sal", quantity: 1, unit: "pizca", alternatives: ["sal de mar"] }
    ],
    steps: [
      { stepNumber: 1, description: "Lava y escurre las espinacas.", timerSeconds: 0 },
      { stepNumber: 2, description: "Calienta el aceite en la sartén a fuego medio.", timerSeconds: 60 },
      { stepNumber: 3, description: "Agrega las espinacas y saltea 2 minutos.", timerSeconds: 120 },
      { stepNumber: 4, description: "Añade los huevos batidos y revuelve hasta cocer.", timerSeconds: 90, detailedNote: "Revuelve constantemente para que queden cremosos" }
    ],
    nutrition: { calories: 280, protein: 18, carbs: 6, fat: 20 },
    prepTimeMinutes: 10,
    estimatedCost: 25,
    difficulty: "fácil",
    ratings: { average: 4.7, count: 83 }
  },
  {
    title: "Avena nocturna con frutas",
    description: "Avena preparada desde la noche, perfecta para un desayuno sin complicaciones.",
    imageUrl: "https://images.unsplash.com/photo-1517673400267-0251440c45dc",
    category: "desayuno",
    dietTypes: ["normal", "vegetarian", "vegan"],
    allergens: [],
    ingredients: [
      { name: "Avena", quantity: 50, unit: "g", alternatives: ["quinoa"] },
      { name: "Leche de almendras", quantity: 200, unit: "ml", alternatives: ["leche de coco"] },
      { name: "Plátano", quantity: 1, unit: "pieza", alternatives: ["manzana"] },
      { name: "Fresas", quantity: 50, unit: "g", alternatives: ["frambuesas"] },
      { name: "Miel", quantity: 10, unit: "ml", alternatives: ["sirope de agave"] }
    ],
    steps: [
      { stepNumber: 1, description: "Mezcla la avena con la leche en un frasco.", timerSeconds: 0 },
      { stepNumber: 2, description: "Corta el plátano en rodajas y las fresas en trozos.", timerSeconds: 120 },
      { stepNumber: 3, description: "Agrega la fruta a la mezcla.", timerSeconds: 0 },
      { stepNumber: 4, description: "Añade la miel y refrigera toda la noche.", timerSeconds: 0, detailedNote: "Mínimo 8 horas de refrigeración" }
    ],
    nutrition: { calories: 320, protein: 10, carbs: 55, fat: 8 },
    prepTimeMinutes: 15,
    estimatedCost: 30,
    difficulty: "fácil",
    ratings: { average: 4.5, count: 67 }
  },
  {
    title: "Smoothie bowl de frutos rojos",
    description: "Desayuno refrescante y lleno de antioxidantes.",
    imageUrl: "https://images.unsplash.com/photo-1494599948593-3dafe8338d71",
    category: "desayuno",
    dietTypes: ["normal", "vegetarian", "vegan"],
    allergens: [],
    ingredients: [
      { name: "Frutas congeladas", quantity: 200, unit: "g", alternatives: ["frutas frescas + hielo"] },
      { name: "Plátano", quantity: 1, unit: "pieza", alternatives: ["mango"] },
      { name: "Leche de coco", quantity: 100, unit: "ml", alternatives: ["leche de almendras"] },
      { name: "Granola", quantity: 30, unit: "g", alternatives: ["nueces"] },
      { name: "Semillas de chía", quantity: 10, unit: "g", alternatives: ["linaza"] }
    ],
    steps: [
      { stepNumber: 1, description: "Licúa las frutas congeladas, plátano y leche.", timerSeconds: 120 },
      { stepNumber: 2, description: "Vierte en un bowl.", timerSeconds: 0 },
      { stepNumber: 3, description: "Decora con granola y semillas.", timerSeconds: 60 }
    ],
    nutrition: { calories: 280, protein: 8, carbs: 45, fat: 9 },
    prepTimeMinutes: 10,
    estimatedCost: 45,
    difficulty: "fácil",
    ratings: { average: 4.8, count: 92 }
  },
  {
    title: "Omelette de champiñones",
    description: "Omelette francés con champiñones salteados y queso.",
    imageUrl: "https://images.unsplash.com/photo-1546069901-eacef0df6022",
    category: "desayuno",
    dietTypes: ["normal", "vegetarian"],
    allergens: ["huevo", "lactosa"],
    ingredients: [
      { name: "Huevo", quantity: 3, unit: "piezas", alternatives: ["claras de huevo"] },
      { name: "Champiñones", quantity: 100, unit: "g", alternatives: ["portobello"] },
      { name: "Queso manchego", quantity: 30, unit: "g", alternatives: ["queso de cabra"] },
      { name: "Mantequilla", quantity: 15, unit: "g", alternatives: ["aceite de oliva"] }
    ],
    steps: [
      { stepNumber: 1, description: "Lava y corta los champiñones en láminas.", timerSeconds: 120 },
      { stepNumber: 2, description: "Saltea los champiñones en mantequilla.", timerSeconds: 180 },
      { stepNumber: 3, description: "Bate los huevos con sal y pimienta.", timerSeconds: 60 },
      { stepNumber: 4, description: "Vierte los huevos y cocina 2 minutos.", timerSeconds: 120 },
      { stepNumber: 5, description: "Agrega queso y dobla el omelette.", timerSeconds: 60 }
    ],
    nutrition: { calories: 380, protein: 24, carbs: 8, fat: 28 },
    prepTimeMinutes: 15,
    estimatedCost: 40,
    difficulty: "media",
    ratings: { average: 4.6, count: 58 }
  },
  {
    title: "Hot cakes de avena",
    description: "Hot cakes saludables hechos con avena y plátano.",
    imageUrl: "https://images.unsplash.com/photo-1528207776546-365bb710ee93",
    category: "desayuno",
    dietTypes: ["normal", "vegetarian", "vegan"],
    allergens: ["gluten"],
    ingredients: [
      { name: "Avena", quantity: 100, unit: "g", alternatives: ["harina de avena"] },
      { name: "Plátano", quantity: 2, unit: "piezas", alternatives: ["manzana"] },
      { name: "Leche vegetal", quantity: 150, unit: "ml", alternatives: ["agua"] },
      { name: "Polvo para hornear", quantity: 5, unit: "g", alternatives: ["bicarbonato"] },
      { name: "Aceite de coco", quantity: 15, unit: "ml", alternatives: ["aceite vegetal"] }
    ],
    steps: [
      { stepNumber: 1, description: "Muele la avena hasta hacer harina.", timerSeconds: 60 },
      { stepNumber: 2, description: "Licúa todos los ingredientes.", timerSeconds: 90 },
      { stepNumber: 3, description: "Calienta una sartén con aceite.", timerSeconds: 60 },
      { stepNumber: 4, description: "Vierte porciones y cocina 2 min por lado.", timerSeconds: 240 }
    ],
    nutrition: { calories: 350, protein: 12, carbs: 58, fat: 9 },
    prepTimeMinutes: 20,
    estimatedCost: 35,
    difficulty: "fácil",
    ratings: { average: 4.7, count: 76 }
  },
  {
    title: "Tostadas de aguacate",
    description: "Tostadas crujientes con aguacate y huevo pochado.",
    imageUrl: "https://images.unsplash.com/photo-1603046891726-36bfd957e0c5",
    category: "desayuno",
    dietTypes: ["normal", "vegetarian"],
    allergens: ["gluten", "huevo"],
    ingredients: [
      { name: "Pan integral", quantity: 2, unit: "rebanadas", alternatives: ["pan de masa madre"] },
      { name: "Aguacate", quantity: 1, unit: "pieza", alternatives: ["guacamole"] },
      { name: "Huevo", quantity: 2, unit: "piezas", alternatives: ["tofu revuelto"] },
      { name: "Limón", quantity: 0.5, unit: "pieza", alternatives: ["vinagre"] },
      { name: "Chile en hojuelas", quantity: 1, unit: "pizca", alternatives: ["pimienta"] }
    ],
    steps: [
      { stepNumber: 1, description: "Tuesta el pan hasta que esté dorado.", timerSeconds: 180 },
      { stepNumber: 2, description: "Machaca el aguacate con limón y sal.", timerSeconds: 60 },
      { stepNumber: 3, description: "Pocha los huevos en agua caliente.", timerSeconds: 240 },
      { stepNumber: 4, description: "Unta el aguacate y coloca el huevo.", timerSeconds: 60 }
    ],
    nutrition: { calories: 420, protein: 18, carbs: 32, fat: 26 },
    prepTimeMinutes: 15,
    estimatedCost: 45,
    difficulty: "media",
    ratings: { average: 4.9, count: 104 }
  },
  {
    title: "Chilaquiles verdes",
    description: "Clásico desayuno mexicano con totopos y salsa verde.",
    imageUrl: "https://images.unsplash.com/photo-1613514785940-daed07799d9b",
    category: "desayuno",
    dietTypes: ["normal"],
    allergens: ["gluten", "lactosa"],
    ingredients: [
      { name: "Totopos", quantity: 150, unit: "g", alternatives: ["tortillas fritas"] },
      { name: "Salsa verde", quantity: 200, unit: "ml", alternatives: ["salsa roja"] },
      { name: "Crema", quantity: 50, unit: "ml", alternatives: ["yogurt griego"] },
      { name: "Queso fresco", quantity: 50, unit: "g", alternatives: ["queso panela"] },
      { name: "Cebolla", quantity: 30, unit: "g", alternatives: ["cebolla morada"] }
    ],
    steps: [
      { stepNumber: 1, description: "Calienta la salsa en una sartén.", timerSeconds: 180 },
      { stepNumber: 2, description: "Agrega los totopos y mezcla.", timerSeconds: 120 },
      { stepNumber: 3, description: "Sirve con crema, queso y cebolla.", timerSeconds: 60 }
    ],
    nutrition: { calories: 480, protein: 12, carbs: 58, fat: 22 },
    prepTimeMinutes: 15,
    estimatedCost: 50,
    difficulty: "fácil",
    ratings: { average: 4.8, count: 156 }
  },
  {
    title: "Yogurt con granola casera",
    description: "Yogurt cremoso con granola crujiente hecha en casa.",
    imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777",
    category: "desayuno",
    dietTypes: ["normal", "vegetarian"],
    allergens: ["lactosa", "gluten"],
    ingredients: [
      { name: "Yogurt griego", quantity: 200, unit: "g", alternatives: ["yogurt de coco"] },
      { name: "Avena", quantity: 50, unit: "g", alternatives: ["quinoa inflada"] },
      { name: "Miel", quantity: 20, unit: "ml", alternatives: ["maple syrup"] },
      { name: "Nueces", quantity: 20, unit: "g", alternatives: ["almendras"] },
      { name: "Arándanos", quantity: 30, unit: "g", alternatives: ["fresas"] }
    ],
    steps: [
      { stepNumber: 1, description: "Mezcla avena, nueces y miel.", timerSeconds: 60 },
      { stepNumber: 2, description: "Hornea la mezcla a 180°C por 10 min.", timerSeconds: 600 },
      { stepNumber: 3, description: "Deja enfriar la granola.", timerSeconds: 300 },
      { stepNumber: 4, description: "Sirve yogurt con granola y fruta.", timerSeconds: 60 }
    ],
    nutrition: { calories: 380, protein: 15, carbs: 42, fat: 18 },
    prepTimeMinutes: 25,
    estimatedCost: 55,
    difficulty: "media",
    ratings: { average: 4.6, count: 48 }
  },

  // COMIDAS (10 recetas)
  {
    title: "Pechuga de pollo a la plancha",
    description: "Pechuga jugosa con verduras salteadas, perfecta para una comida balanceada.",
    imageUrl: "https://images.unsplash.com/photo-1598515213698-3fb0145a3efb",
    category: "comida",
    dietTypes: ["normal"],
    allergens: [],
    ingredients: [
      { name: "Pechuga de pollo", quantity: 200, unit: "g", alternatives: ["pierna de pollo"] },
      { name: "Brócoli", quantity: 150, unit: "g", alternatives: ["coliflor"] },
      { name: "Zanahoria", quantity: 1, unit: "pieza", alternatives: ["calabaza"] },
      { name: "Aceite de oliva", quantity: 15, unit: "ml", alternatives: ["aceite vegetal"] },
      { name: "Especias", quantity: 5, unit: "g", alternatives: ["hierbas finas"] }
    ],
    steps: [
      { stepNumber: 1, description: "Sazona el pollo con sal y especias.", timerSeconds: 0 },
      { stepNumber: 2, description: "Calienta la plancha con aceite.", timerSeconds: 60 },
      { stepNumber: 3, description: "Cocina el pollo 6 min por lado.", timerSeconds: 720 },
      { stepNumber: 4, description: "Saltea las verduras 5 minutos.", timerSeconds: 300 }
    ],
    nutrition: { calories: 350, protein: 40, carbs: 15, fat: 15 },
    prepTimeMinutes: 25,
    estimatedCost: 60,
    difficulty: "fácil",
    ratings: { average: 4.5, count: 112 }
  },
  {
    title: "Ensalada César con pollo",
    description: "Clásica ensalada César con pollo a la parrilla y aderezo casero.",
    imageUrl: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9",
    category: "comida",
    dietTypes: ["normal"],
    allergens: ["huevo", "lactosa"],
    ingredients: [
      { name: "Lechuga romana", quantity: 200, unit: "g", alternatives: ["lechuga iceberg"] },
      { name: "Pollo", quantity: 150, unit: "g", alternatives: ["pavo"] },
      { name: "Queso parmesano", quantity: 30, unit: "g", alternatives: ["queso añejo"] },
      { name: "Crutones", quantity: 30, unit: "g", alternatives: ["nueces"] },
      { name: "Aderezo César", quantity: 50, unit: "ml", alternatives: ["yogurt con ajo"] }
    ],
    steps: [
      { stepNumber: 1, description: "Cocina el pollo a la parrilla.", timerSeconds: 600 },
      { stepNumber: 2, description: "Lava y corta la lechuga.", timerSeconds: 180 },
      { stepNumber: 3, description: "Mezcla todos los ingredientes.", timerSeconds: 120 },
      { stepNumber: 4, description: "Añade el aderezo y sirve.", timerSeconds: 60 }
    ],
    nutrition: { calories: 420, protein: 35, carbs: 18, fat: 24 },
    prepTimeMinutes: 20,
    estimatedCost: 75,
    difficulty: "fácil",
    ratings: { average: 4.4, count: 89 }
  },
  {
    title: "Pasta primavera",
    description: "Pasta con verduras de temporada y salsa de tomate fresca.",
    imageUrl: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8",
    category: "comida",
    dietTypes: ["normal", "vegetarian"],
    allergens: ["gluten"],
    ingredients: [
      { name: "Pasta", quantity: 200, unit: "g", alternatives: ["pasta integral"] },
      { name: "Calabacín", quantity: 1, unit: "pieza", alternatives: ["berenjena"] },
      { name: "Pimiento", quantity: 1, unit: "pieza", alternatives: ["jitomate"] },
      { name: "Salsa de tomate", quantity: 200, unit: "ml", alternatives: ["tomates frescos"] },
      { name: "Albahaca", quantity: 10, unit: "g", alternatives: ["orégano"] }
    ],
    steps: [
      { stepNumber: 1, description: "Cocina la pasta en agua con sal.", timerSeconds: 600 },
      { stepNumber: 2, description: "Corta y saltea las verduras.", timerSeconds: 300 },
      { stepNumber: 3, description: "Agrega la salsa de tomate.", timerSeconds: 180 },
      { stepNumber: 4, description: "Mezcla con la pasta y sirve.", timerSeconds: 60 }
    ],
    nutrition: { calories: 450, protein: 15, carbs: 75, fat: 10 },
    prepTimeMinutes: 25,
    estimatedCost: 45,
    difficulty: "fácil",
    ratings: { average: 4.6, count: 78 }
  },
  {
    title: "Filete de pescado al horno",
    description: "Filete de pescado horneado con hierbas y limón.",
    imageUrl: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2",
    category: "comida",
    dietTypes: ["normal"],
    allergens: ["pescado"],
    ingredients: [
      { name: "Filete de pescado", quantity: 200, unit: "g", alternatives: ["tilapia"] },
      { name: "Limón", quantity: 1, unit: "pieza", alternatives: ["naranja"] },
      { name: "Ajo", quantity: 2, unit: "dientes", alternatives: ["cebolla en polvo"] },
      { name: "Perejil", quantity: 10, unit: "g", alternatives: ["cilantro"] },
      { name: "Aceite de oliva", quantity: 15, unit: "ml", alternatives: ["mantequilla"] }
    ],
    steps: [
      { stepNumber: 1, description: "Precalienta el horno a 180°C.", timerSeconds: 300 },
      { stepNumber: 2, description: "Sazona el pescado con limón y ajo.", timerSeconds: 120 },
      { stepNumber: 3, description: "Hornea por 15 minutos.", timerSeconds: 900 },
      { stepNumber: 4, description: "Decora con perejil y sirve.", timerSeconds: 60 }
    ],
    nutrition: { calories: 280, protein: 35, carbs: 5, fat: 12 },
    prepTimeMinutes: 25,
    estimatedCost: 85,
    difficulty: "fácil",
    ratings: { average: 4.7, count: 62 }
  },
  {
    title: "Burrito bowl",
    description: "Bowls estilo burrito con arroz, frijoles y tus ingredientes favoritos.",
    imageUrl: "https://images.unsplash.com/photo-1626132647523-66bc3b7c3d8b",
    category: "comida",
    dietTypes: ["normal", "vegetarian", "vegan"],
    allergens: [],
    ingredients: [
      { name: "Arroz", quantity: 100, unit: "g", alternatives: ["quinoa"] },
      { name: "Frijoles negros", quantity: 150, unit: "g", alternatives: ["frijoles pintos"] },
      { name: "Pollo", quantity: 150, unit: "g", alternatives: ["tofu"] },
      { name: "Aguacate", quantity: 0.5, unit: "pieza", alternatives: ["guacamole"] },
      { name: "Pico de gallo", quantity: 100, unit: "g", alternatives: ["salsa"] }
    ],
    steps: [
      { stepNumber: 1, description: "Cocina el arroz.", timerSeconds: 900 },
      { stepNumber: 2, description: "Calienta los frijoles.", timerSeconds: 180 },
      { stepNumber: 3, description: "Cocina el pollo con especias.", timerSeconds: 480 },
      { stepNumber: 4, description: "Arma el bowl con todos los ingredientes.", timerSeconds: 120 }
    ],
    nutrition: { calories: 580, protein: 35, carbs: 65, fat: 22 },
    prepTimeMinutes: 30,
    estimatedCost: 70,
    difficulty: "media",
    ratings: { average: 4.6, count: 94 }
  },
  {
    title: "Salmón con quinoa",
    description: "Salmón a la plancha con quinoa y espárragos.",
    imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288",
    category: "comida",
    dietTypes: ["normal"],
    allergens: ["pescado"],
    ingredients: [
      { name: "Salmón", quantity: 200, unit: "g", alternatives: ["trucha"] },
      { name: "Quinoa", quantity: 100, unit: "g", alternatives: ["arroz integral"] },
      { name: "Espárragos", quantity: 100, unit: "g", alternatives: ["ejotes"] },
      { name: "Limón", quantity: 0.5, unit: "pieza", alternatives: ["vinagre balsámico"] }
    ],
    steps: [
      { stepNumber: 1, description: "Cocina la quinoa según instrucciones.", timerSeconds: 900 },
      { stepNumber: 2, description: "Cocina el salmón 4 min por lado.", timerSeconds: 480 },
      { stepNumber: 3, description: "Saltea los espárragos.", timerSeconds: 240 },
      { stepNumber: 4, description: "Sirve con rodajas de limón.", timerSeconds: 60 }
    ],
    nutrition: { calories: 520, protein: 40, carbs: 35, fat: 25 },
    prepTimeMinutes: 25,
    estimatedCost: 120,
    difficulty: "media",
    ratings: { average: 4.8, count: 86 }
  },
  {
    title: "Lentejas guisadas",
    description: "Guiso de lentejas con verduras, perfecto para días fríos.",
    imageUrl: "https://images.unsplash.com/photo-1546549032-9571cd6b27df",
    category: "comida",
    dietTypes: ["normal", "vegetarian", "vegan"],
    allergens: [],
    ingredients: [
      { name: "Lentejas", quantity: 200, unit: "g", alternatives: ["garbanzos"] },
      { name: "Zanahoria", quantity: 1, unit: "pieza", alternatives: ["chayote"] },
      { name: "Cebolla", quantity: 1, unit: "pieza", alternatives: ["puerro"] },
      { name: "Jitomate", quantity: 2, unit: "piezas", alternatives: ["tomate de lata"] },
      { name: "Comino", quantity: 5, unit: "g", alternatives: ["orégano"] }
    ],
    steps: [
      { stepNumber: 1, description: "Sofríe la cebolla y el jitomate.", timerSeconds: 300 },
      { stepNumber: 2, description: "Agrega las lentejas y agua.", timerSeconds: 60 },
      { stepNumber: 3, description: "Cocina a fuego medio por 25 min.", timerSeconds: 1500 },
      { stepNumber: 4, description: "Añade la zanahoria y cocina 10 min más.", timerSeconds: 600 }
    ],
    nutrition: { calories: 380, protein: 22, carbs: 60, fat: 5 },
    prepTimeMinutes: 45,
    estimatedCost: 40,
    difficulty: "fácil",
    ratings: { average: 4.5, count: 73 }
  },
  {
    title: "Pechuga rellena de espinacas",
    description: "Pechuga de pollo rellena de espinacas y queso panela.",
    imageUrl: "https://images.unsplash.com/photo-1604908176997-1254c9337e5a",
    category: "comida",
    dietTypes: ["normal"],
    allergens: ["lactosa"],
    ingredients: [
      { name: "Pechuga de pollo", quantity: 2, unit: "piezas", alternatives: ["pierna deshuesada"] },
      { name: "Espinacas", quantity: 100, unit: "g", alternatives: ["acelgas"] },
      { name: "Queso panela", quantity: 80, unit: "g", alternatives: ["queso oaxaca"] },
      { name: "Ajo", quantity: 2, unit: "dientes", alternatives: ["cebolla"] }
    ],
    steps: [
      { stepNumber: 1, description: "Abre las pechugas para rellenar.", timerSeconds: 180 },
      { stepNumber: 2, description: "Saltea las espinacas con ajo.", timerSeconds: 180 },
      { stepNumber: 3, description: "Rellena las pechugas y asegura con palillos.", timerSeconds: 120 },
      { stepNumber: 4, description: "Cocina en sartén 7 min por lado.", timerSeconds: 840 }
    ],
    nutrition: { calories: 420, protein: 48, carbs: 8, fat: 22 },
    prepTimeMinutes: 30,
    estimatedCost: 75,
    difficulty: "media",
    ratings: { average: 4.7, count: 55 }
  },
  {
    title: "Sopa de verduras",
    description: "Sopa nutritiva con verduras de temporada.",
    imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744e3d",
    category: "comida",
    dietTypes: ["normal", "vegetarian", "vegan"],
    allergens: [],
    ingredients: [
      { name: "Calabacita", quantity: 1, unit: "pieza", alternatives: ["chayote"] },
      { name: "Zanahoria", quantity: 1, unit: "pieza", alternatives: ["papa"] },
      { name: "Elote", quantity: 1, unit: "pieza", alternatives: ["habas"] },
      { name: "Apio", quantity: 2, unit: "ramas", alternatives: ["poro"] },
      { name: "Fideos", quantity: 50, unit: "g", alternatives: ["arroz"] }
    ],
    steps: [
      { stepNumber: 1, description: "Corta todas las verduras en cubos.", timerSeconds: 300 },
      { stepNumber: 2, description: "Sofríe las verduras en aceite.", timerSeconds: 240 },
      { stepNumber: 3, description: "Agrega agua y cocina 20 minutos.", timerSeconds: 1200 },
      { stepNumber: 4, description: "Añade la pasta y cocina 8 minutos.", timerSeconds: 480 }
    ],
    nutrition: { calories: 180, protein: 6, carbs: 32, fat: 4 },
    prepTimeMinutes: 35,
    estimatedCost: 35,
    difficulty: "fácil",
    ratings: { average: 4.3, count: 67 }
  },
  {
    title: "Tacos de pescado estilo Baja",
    description: "Tacos de pescado empanizado con repollo y crema de chipotle.",
    imageUrl: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b",
    category: "comida",
    dietTypes: ["normal"],
    allergens: ["pescado", "gluten", "lactosa"],
    ingredients: [
      { name: "Pescado blanco", quantity: 300, unit: "g", alternatives: ["tilapia"] },
      { name: "Harina", quantity: 100, unit: "g", alternatives: ["harina de maíz"] },
      { name: "Cerveza", quantity: 150, unit: "ml", alternatives: ["agua con gas"] },
      { name: "Repollo", quantity: 100, unit: "g", alternatives: ["lechuga"] },
      { name: "Crema", quantity: 50, unit: "ml", alternatives: ["yogurt"] },
      { name: "Chipotle", quantity: 20, unit: "g", alternatives: ["salsa picante"] }
    ],
    steps: [
      { stepNumber: 1, description: "Prepara la cerveza con harina para el empanizado.", timerSeconds: 120 },
      { stepNumber: 2, description: "Empaniza el pescado y fríe.", timerSeconds: 480 },
      { stepNumber: 3, description: "Mezcla crema con chipotle.", timerSeconds: 60 },
      { stepNumber: 4, description: "Arma los tacos con repollo y salsa.", timerSeconds: 180 }
    ],
    nutrition: { calories: 520, protein: 28, carbs: 45, fat: 25 },
    prepTimeMinutes: 30,
    estimatedCost: 90,
    difficulty: "media",
    ratings: { average: 4.9, count: 124 }
  },

  // CENAS (9 recetas)
  {
    title: "Ensalada de atún",
    description: "Ensalada fresca con atún, verduras y aderezo de limón.",
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd",
    category: "cena",
    dietTypes: ["normal"],
    allergens: ["pescado"],
    ingredients: [
      { name: "Atún en lata", quantity: 1, unit: "lata", alternatives: ["salmón enlatado"] },
      { name: "Lechuga", quantity: 100, unit: "g", alternatives: ["espinacas"] },
      { name: "Jitomate", quantity: 1, unit: "pieza", alternatives: ["tomate cherry"] },
      { name: "Pepino", quantity: 0.5, unit: "pieza", alternatives: ["calabacita"] },
      { name: "Limón", quantity: 0.5, unit: "pieza", alternatives: ["vinagre"] }
    ],
    steps: [
      { stepNumber: 1, description: "Lava y corta todas las verduras.", timerSeconds: 240 },
      { stepNumber: 2, description: "Escurre el atún.", timerSeconds: 60 },
      { stepNumber: 3, description: "Mezcla todos los ingredientes.", timerSeconds: 120 },
      { stepNumber: 4, description: "Aliña con limón y aceite.", timerSeconds: 60 }
    ],
    nutrition: { calories: 250, protein: 22, carbs: 12, fat: 12 },
    prepTimeMinutes: 15,
    estimatedCost: 45,
    difficulty: "fácil",
    ratings: { average: 4.4, count: 92 }
  },
  {
    title: "Sopa de tomate",
    description: "Crema de tomate casera, perfecta para una cena ligera.",
    imageUrl: "https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a",
    category: "cena",
    dietTypes: ["normal", "vegetarian", "vegan"],
    allergens: [],
    ingredients: [
      { name: "Tomates", quantity: 6, unit: "piezas", alternatives: ["tomate de lata"] },
      { name: "Cebolla", quantity: 0.5, unit: "pieza", alternatives: ["puerro"] },
      { name: "Ajo", quantity: 2, unit: "dientes", alternatives: ["cebolla en polvo"] },
      { name: "Caldo de verduras", quantity: 500, unit: "ml", alternatives: ["agua"] },
      { name: "Albahaca", quantity: 10, unit: "g", alternatives: ["orégano"] }
    ],
    steps: [
      { stepNumber: 1, description: "Sofríe cebolla y ajo.", timerSeconds: 180 },
      { stepNumber: 2, description: "Agrega los tomates picados.", timerSeconds: 60 },
      { stepNumber: 3, description: "Vierte el caldo y cocina 15 min.", timerSeconds: 900 },
      { stepNumber: 4, description: "Licúa y sirve con albahaca.", timerSeconds: 120 }
    ],
    nutrition: { calories: 120, protein: 4, carbs: 22, fat: 3 },
    prepTimeMinutes: 25,
    estimatedCost: 35,
    difficulty: "fácil",
    ratings: { average: 4.5, count: 58 }
  },
  {
    title: "Quesadillas de hongos",
    description: "Quesadillas con hongos salteados y queso derretido.",
    imageUrl: "https://images.unsplash.com/photo-1618040996337-56904b7850c9",
    category: "cena",
    dietTypes: ["normal", "vegetarian"],
    allergens: ["gluten", "lactosa"],
    ingredients: [
      { name: "Tortillas de maíz", quantity: 4, unit: "piezas", alternatives: ["tortillas de harina"] },
      { name: "Hongos", quantity: 200, unit: "g", alternatives: ["setas"] },
      { name: "Queso Oaxaca", quantity: 100, unit: "g", alternatives: ["queso manchego"] },
      { name: "Cebolla", quantity: 0.5, unit: "pieza", alternatives: ["cebolla morada"] },
      { name: "Epazote", quantity: 5, unit: "g", alternatives: ["cilantro"] }
    ],
    steps: [
      { stepNumber: 1, description: "Saltea los hongos con cebolla.", timerSeconds: 300 },
      { stepNumber: 2, description: "Calienta las tortillas.", timerSeconds: 120 },
      { stepNumber: 3, description: "Rellena con hongos y queso.", timerSeconds: 180 },
      { stepNumber: 4, description: "Dora las quesadillas en el comal.", timerSeconds: 240 }
    ],
    nutrition: { calories: 380, protein: 16, carbs: 35, fat: 20 },
    prepTimeMinutes: 20,
    estimatedCost: 45,
    difficulty: "fácil",
    ratings: { average: 4.6, count: 71 }
  },
  {
    title: "Wrap de pollo",
    description: "Wrap integral con pollo, lechuga y aderezo de yogurt.",
    imageUrl: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f",
    category: "cena",
    dietTypes: ["normal"],
    allergens: ["gluten", "lactosa"],
    ingredients: [
      { name: "Tortilla integral", quantity: 2, unit: "piezas", alternatives: ["tortilla de espinaca"] },
      { name: "Pollo", quantity: 150, unit: "g", alternatives: ["pavo"] },
      { name: "Lechuga", quantity: 50, unit: "g", alternatives: ["espinaca"] },
      { name: "Yogurt griego", quantity: 50, unit: "g", alternatives: ["mayonesa light"] },
      { name: "Aguacate", quantity: 0.5, unit: "pieza", alternatives: ["guacamole"] }
    ],
    steps: [
      { stepNumber: 1, description: "Cocina y desmenuza el pollo.", timerSeconds: 480 },
      { stepNumber: 2, description: "Prepara el aderezo con yogurt y especias.", timerSeconds: 60 },
      { stepNumber: 3, description: "Calienta las tortillas.", timerSeconds: 60 },
      { stepNumber: 4, description: "Arma los wraps y enrolla.", timerSeconds: 180 }
    ],
    nutrition: { calories: 410, protein: 32, carbs: 35, fat: 16 },
    prepTimeMinutes: 20,
    estimatedCost: 55,
    difficulty: "fácil",
    ratings: { average: 4.5, count: 47 }
  },
  {
    title: "Ensalada de quinoa",
    description: "Ensalada fresca de quinoa con vegetales y aderezo de limón.",
    imageUrl: "https://images.unsplash.com/photo-1505576399279-565b52d4ac71",
    category: "cena",
    dietTypes: ["normal", "vegetarian", "vegan"],
    allergens: [],
    ingredients: [
      { name: "Quinoa", quantity: 100, unit: "g", alternatives: ["cous cous"] },
      { name: "Pepino", quantity: 0.5, unit: "pieza", alternatives: ["calabacita"] },
      { name: "Jitomate", quantity: 2, unit: "piezas", alternatives: ["tomate cherry"] },
      { name: "Cilantro", quantity: 10, unit: "g", alternatives: ["perejil"] },
      { name: "Limón", quantity: 1, unit: "pieza", alternatives: ["naranja"] }
    ],
    steps: [
      { stepNumber: 1, description: "Cocina la quinoa según instrucciones.", timerSeconds: 900 },
      { stepNumber: 2, description: "Corta todas las verduras en cubos.", timerSeconds: 240 },
      { stepNumber: 3, description: "Mezcla quinoa con verduras.", timerSeconds: 120 },
      { stepNumber: 4, description: "Aliña con limón y aceite.", timerSeconds: 60 }
    ],
    nutrition: { calories: 280, protein: 10, carbs: 42, fat: 8 },
    prepTimeMinutes: 20,
    estimatedCost: 50,
    difficulty: "fácil",
    ratings: { average: 4.4, count: 63 }
  },
  {
    title: "Pescado al vapor con verduras",
    description: "Filete de pescado cocido al vapor con juliana de verduras.",
    imageUrl: "https://images.unsplash.com/photo-1559847844-5315695dadae",
    category: "cena",
    dietTypes: ["normal"],
    allergens: ["pescado"],
    ingredients: [
      { name: "Filete de pescado", quantity: 150, unit: "g", alternatives: ["tilapia"] },
      { name: "Zanahoria", quantity: 1, unit: "pieza", alternatives: ["chayote"] },
      { name: "Calabacita", quantity: 1, unit: "pieza", alternatives: ["ejotes"] },
      { name: "Jengibre", quantity: 10, unit: "g", alternatives: ["ajo"] },
      { name: "Salsa de soya", quantity: 20, unit: "ml", alternatives: ["limón"] }
    ],
    steps: [
      { stepNumber: 1, description: "Corta las verduras en tiras finas.", timerSeconds: 240 },
      { stepNumber: 2, description: "Coloca pescado y verduras en vaporera.", timerSeconds: 60 },
      { stepNumber: 3, description: "Cocina al vapor por 12 minutos.", timerSeconds: 720 },
      { stepNumber: 4, description: "Sirve con salsa de soya.", timerSeconds: 60 }
    ],
    nutrition: { calories: 200, protein: 28, carbs: 10, fat: 5 },
    prepTimeMinutes: 20,
    estimatedCost: 80,
    difficulty: "fácil",
    ratings: { average: 4.6, count: 41 }
  },
  {
    title: "Sándwich de aguacate",
    description: "Sándwich integral con aguacate, jitomate y queso panela.",
    imageUrl: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af",
    category: "cena",
    dietTypes: ["normal", "vegetarian"],
    allergens: ["gluten", "lactosa"],
    ingredients: [
      { name: "Pan integral", quantity: 2, unit: "rebanadas", alternatives: ["pan de centeno"] },
      { name: "Aguacate", quantity: 0.5, unit: "pieza", alternatives: ["guacamole"] },
      { name: "Queso panela", quantity: 50, unit: "g", alternatives: ["queso fresco"] },
      { name: "Jitomate", quantity: 0.5, unit: "pieza", alternatives: ["jitomate deshidratado"] },
      { name: "Espinacas", quantity: 20, unit: "g", alternatives: ["lechuga"] }
    ],
    steps: [
      { stepNumber: 1, description: "Tuesta el pan ligeramente.", timerSeconds: 120 },
      { stepNumber: 2, description: "Machaca el aguacate con sal.", timerSeconds: 60 },
      { stepNumber: 3, description: "Corta el queso y jitomate en rodajas.", timerSeconds: 120 },
      { stepNumber: 4, description: "Arma el sándwich con todos los ingredientes.", timerSeconds: 120 }
    ],
    nutrition: { calories: 350, protein: 15, carbs: 38, fat: 16 },
    prepTimeMinutes: 15,
    estimatedCost: 40,
    difficulty: "fácil",
    ratings: { average: 4.5, count: 89 }
  },
  {
    title: "Crema de calabacita",
    description: "Crema suave de calabacita con un toque de epazote.",
    imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744e3d",
    category: "cena",
    dietTypes: ["normal", "vegetarian", "vegan"],
    allergens: [],
    ingredients: [
      { name: "Calabacitas", quantity: 4, unit: "piezas", alternatives: ["chayotes"] },
      { name: "Cebolla", quantity: 0.5, unit: "pieza", alternatives: ["puerro"] },
      { name: "Ajo", quantity: 2, unit: "dientes", alternatives: ["cebolla en polvo"] },
      { name: "Caldo de verduras", quantity: 500, unit: "ml", alternatives: ["agua"] },
      { name: "Epazote", quantity: 5, unit: "g", alternatives: ["cilantro"] }
    ],
    steps: [
      { stepNumber: 1, description: "Pica la cebolla y el ajo finamente.", timerSeconds: 180 },
      { stepNumber: 2, description: "Sofríe en una olla con aceite.", timerSeconds: 180 },
      { stepNumber: 3, description: "Agrega las calabacitas picadas.", timerSeconds: 120 },
      { stepNumber: 4, description: "Vierte el caldo y cocina 15 min.", timerSeconds: 900 },
      { stepNumber: 5, description: "Licúa, regresa a la olla y calienta.", timerSeconds: 300 }
    ],
    nutrition: { calories: 150, protein: 6, carbs: 24, fat: 4 },
    prepTimeMinutes: 30,
    estimatedCost: 30,
    difficulty: "fácil",
    ratings: { average: 4.4, count: 56 }
  },
  {
    title: "Tostadas de tinga de pollo",
    description: "Tostadas crujientes con tinga de pollo, crema y queso.",
    imageUrl: "https://images.unsplash.com/photo-1613514785940-daed07799d9b",
    category: "cena",
    dietTypes: ["normal"],
    allergens: ["gluten", "lactosa"],
    ingredients: [
      { name: "Pollo", quantity: 200, unit: "g", alternatives: ["res deshebrada"] },
      { name: "Tostadas", quantity: 4, unit: "piezas", alternatives: ["tostadas horneadas"] },
      { name: "Jitomate", quantity: 3, unit: "piezas", alternatives: ["tomate de lata"] },
      { name: "Cebolla", quantity: 0.5, unit: "pieza", alternatives: ["cebolla morada"] },
      { name: "Chipotle", quantity: 2, unit: "piezas", alternatives: ["chile morita"] },
      { name: "Crema", quantity: 50, unit: "ml", alternatives: ["yogurt"] }
    ],
    steps: [
      { stepNumber: 1, description: "Cocina el pollo y deshébralo.", timerSeconds: 900 },
      { stepNumber: 2, description: "Licúa jitomate con chipotle.", timerSeconds: 120 },
      { stepNumber: 3, description: "Sofríe cebolla, agrega salsa y pollo.", timerSeconds: 480 },
      { stepNumber: 4, description: "Sirve sobre tostadas con crema.", timerSeconds: 180 }
    ],
    nutrition: { calories: 420, protein: 28, carbs: 35, fat: 20 },
    prepTimeMinutes: 30,
    estimatedCost: 60,
    difficulty: "media",
    ratings: { average: 4.7, count: 82 }
  },

  // SNACKS (8 recetas)
  {
    title: "Palitos de zanahoria con hummus",
    description: "Snack saludable de vegetales frescos con hummus casero.",
    imageUrl: "https://images.unsplash.com/photo-1628291277437-5d0e3c9cd45b",
    category: "snack",
    dietTypes: ["normal", "vegetarian", "vegan"],
    allergens: [],
    ingredients: [
      { name: "Garbanzos", quantity: 200, unit: "g", alternatives: ["habas"] },
      { name: "Tahini", quantity: 30, unit: "g", alternatives: ["aceite de ajonjolí"] },
      { name: "Limón", quantity: 1, unit: "pieza", alternatives: ["vinagre"] },
      { name: "Ajo", quantity: 1, unit: "diente", alternatives: ["comino"] },
      { name: "Zanahoria", quantity: 2, unit: "piezas", alternatives: ["apio"] }
    ],
    steps: [
      { stepNumber: 1, description: "Licúa garbanzos, tahini, limón y ajo.", timerSeconds: 120 },
      { stepNumber: 2, description: "Agrega agua hasta lograr consistencia.", timerSeconds: 60 },
      { stepNumber: 3, description: "Pela y corta las zanahorias en palitos.", timerSeconds: 180 },
      { stepNumber: 4, description: "Sirve el hummus con los palitos.", timerSeconds: 60 }
    ],
    nutrition: { calories: 280, protein: 10, carbs: 35, fat: 12 },
    prepTimeMinutes: 15,
    estimatedCost: 35,
    difficulty: "fácil",
    ratings: { average: 4.6, count: 73 }
  },
  {
    title: "Yogurt con frutas y granola",
    description: "Yogurt natural con frutas frescas y granola crujiente.",
    imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777",
    category: "snack",
    dietTypes: ["normal", "vegetarian"],
    allergens: ["lactosa"],
    ingredients: [
      { name: "Yogurt natural", quantity: 150, unit: "g", alternatives: ["yogurt de coco"] },
      { name: "Fresas", quantity: 50, unit: "g", alternatives: ["frambuesas"] },
      { name: "Plátano", quantity: 0.5, unit: "pieza", alternatives: ["manzana"] },
      { name: "Granola", quantity: 20, unit: "g", alternatives: ["nueces"] },
      { name: "Miel", quantity: 10, unit: "ml", alternatives: ["stevia"] }
    ],
    steps: [
      { stepNumber: 1, description: "Lava y corta las frutas.", timerSeconds: 120 },
      { stepNumber: 2, description: "Coloca el yogurt en un bowl.", timerSeconds: 30 },
      { stepNumber: 3, description: "Agrega las frutas y la granola.", timerSeconds: 60 },
      { stepNumber: 4, description: "Endulza con miel al gusto.", timerSeconds: 30 }
    ],
    nutrition: { calories: 220, protein: 8, carbs: 32, fat: 7 },
    prepTimeMinutes: 10,
    estimatedCost: 40,
    difficulty: "fácil",
    ratings: { average: 4.5, count: 94 }
  },
  {
    title: "Batido de proteína",
    description: "Batido post-entrenamiento con proteína y frutas.",
    imageUrl: "https://images.unsplash.com/photo-1556888335-95371826f966",
    category: "snack",
    dietTypes: ["normal", "vegetarian"],
    allergens: ["lactosa"],
    ingredients: [
      { name: "Proteína en polvo", quantity: 30, unit: "g", alternatives: ["proteína vegana"] },
      { name: "Plátano", quantity: 1, unit: "pieza", alternatives: ["mango"] },
      { name: "Leche", quantity: 250, unit: "ml", alternatives: ["leche de almendras"] },
      { name: "Mantequilla de maní", quantity: 15, unit: "g", alternatives: ["mantequilla de almendra"] }
    ],
    steps: [
      { stepNumber: 1, description: "Pela y corta el plátano.", timerSeconds: 60 },
      { stepNumber: 2, description: "Licúa todos los ingredientes.", timerSeconds: 90 },
      { stepNumber: 3, description: "Sirve inmediatamente.", timerSeconds: 30 }
    ],
    nutrition: { calories: 320, protein: 30, carbs: 35, fat: 10 },
    prepTimeMinutes: 5,
    estimatedCost: 45,
    difficulty: "fácil",
    ratings: { average: 4.6, count: 68 }
  },
  {
    title: "Manzana con mantequilla de maní",
    description: "Snack rápido y energético de manzana con mantequilla de maní.",
    imageUrl: "https://images.unsplash.com/photo-1530587191325-3db32d826c5e",
    category: "snack",
    dietTypes: ["normal", "vegetarian", "vegan"],
    allergens: [],
    ingredients: [
      { name: "Manzana", quantity: 1, unit: "pieza", alternatives: ["pera"] },
      { name: "Mantequilla de maní", quantity: 30, unit: "g", alternatives: ["mantequilla de almendra"] },
      { name: "Canela", quantity: 1, unit: "pizca", alternatives: ["cacao"] }
    ],
    steps: [
      { stepNumber: 1, description: "Lava y corta la manzana en rebanadas.", timerSeconds: 90 },
      { stepNumber: 2, description: "Unta la mantequilla de maní.", timerSeconds: 60 },
      { stepNumber: 3, description: "Espolvorea con canela.", timerSeconds: 30 }
    ],
    nutrition: { calories: 180, protein: 6, carbs: 22, fat: 9 },
    prepTimeMinutes: 5,
    estimatedCost: 20,
    difficulty: "fácil",
    ratings: { average: 4.7, count: 112 }
  },
  {
    title: "Bolitas de energía",
    description: "Snack energético de dátiles, nueces y cocoa sin hornear.",
    imageUrl: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26",
    category: "snack",
    dietTypes: ["normal", "vegetarian", "vegan"],
    allergens: [],
    ingredients: [
      { name: "Dátiles", quantity: 150, unit: "g", alternatives: ["higos secos"] },
      { name: "Nueces", quantity: 100, unit: "g", alternatives: ["almendras"] },
      { name: "Cocoa", quantity: 20, unit: "g", alternatives: ["cacao"] },
      { name: "Avena", quantity: 50, unit: "g", alternatives: ["coco rallado"] }
    ],
    steps: [
      { stepNumber: 1, description: "Procesa todos los ingredientes.", timerSeconds: 120 },
      { stepNumber: 2, description: "Forma bolitas con la mezcla.", timerSeconds: 180 },
      { stepNumber: 3, description: "Refrigera por 30 minutos.", timerSeconds: 1800 }
    ],
    nutrition: { calories: 150, protein: 4, carbs: 18, fat: 8 },
    prepTimeMinutes: 15,
    estimatedCost: 55,
    difficulty: "fácil",
    ratings: { average: 4.8, count: 87 }
  },
  {
    title: "Chips de kale al horno",
    description: "Crujientes chips de kale horneados, una alternativa saludable.",
    imageUrl: "https://images.unsplash.com/photo-1574457543761-6b7a3dbb4e6c",
    category: "snack",
    dietTypes: ["normal", "vegetarian", "vegan"],
    allergens: [],
    ingredients: [
      { name: "Kale", quantity: 200, unit: "g", alternatives: ["espinaca"] },
      { name: "Aceite de oliva", quantity: 15, unit: "ml", alternatives: ["aceite de coco"] },
      { name: "Sal", quantity: 2, unit: "g", alternatives: ["sal de mar"] },
      { name: "Pimienta", quantity: 1, unit: "pizca", alternatives: ["chile en polvo"] }
    ],
    steps: [
      { stepNumber: 1, description: "Precalienta el horno a 150°C.", timerSeconds: 300 },
      { stepNumber: 2, description: "Lava y seca muy bien el kale.", timerSeconds: 180 },
      { stepNumber: 3, description: "Mezcla con aceite y especias.", timerSeconds: 120 },
      { stepNumber: 4, description: "Hornea por 15 minutos hasta que estén crujientes.", timerSeconds: 900 }
    ],
    nutrition: { calories: 120, protein: 4, carbs: 12, fat: 7 },
    prepTimeMinutes: 25,
    estimatedCost: 45,
    difficulty: "fácil",
    ratings: { average: 4.3, count: 42 }
  },
  {
    title: "Cacahuates enchilados",
    description: "Cacahuates con chile y limón, perfectos para un snack picante.",
    imageUrl: "https://images.unsplash.com/photo-1546549032-9571cd6b27df",
    category: "snack",
    dietTypes: ["normal", "vegetarian", "vegan"],
    allergens: [],
    ingredients: [
      { name: "Cacahuates", quantity: 200, unit: "g", alternatives: ["habas"] },
      { name: "Chile en polvo", quantity: 10, unit: "g", alternatives: ["paprika"] },
      { name: "Limón", quantity: 1, unit: "pieza", alternatives: ["limón en polvo"] },
      { name: "Sal", quantity: 3, unit: "g", alternatives: ["sal de ajo"] }
    ],
    steps: [
      { stepNumber: 1, description: "Tuesta los cacahuates en un comal.", timerSeconds: 300 },
      { stepNumber: 2, description: "Mezcla con chile, sal y jugo de limón.", timerSeconds: 120 },
      { stepNumber: 3, description: "Deja enfriar antes de servir.", timerSeconds: 300 }
    ],
    nutrition: { calories: 320, protein: 14, carbs: 12, fat: 26 },
    prepTimeMinutes: 15,
    estimatedCost: 25,
    difficulty: "fácil",
    ratings: { average: 4.5, count: 78 }
  },
  {
    title: "Rollitos de jamón con queso",
    description: "Rollitos de jamón con queso crema y espárragos.",
    imageUrl: "https://images.unsplash.com/photo-1624374050921-4f1f639ab82f",
    category: "snack",
    dietTypes: ["normal"],
    allergens: ["lactosa"],
    ingredients: [
      { name: "Jamón de pavo", quantity: 6, unit: "rebanadas", alternatives: ["jamón de pollo"] },
      { name: "Queso crema", quantity: 100, unit: "g", alternatives: ["requesón"] },
      { name: "Espárragos", quantity: 6, unit: "piezas", alternatives: ["tiras de pimiento"] }
    ],
    steps: [
      { stepNumber: 1, description: "Blanquea los espárragos en agua caliente.", timerSeconds: 180 },
      { stepNumber: 2, description: "Unta queso crema en cada rebanada.", timerSeconds: 120 },
      { stepNumber: 3, description: "Coloca un espárrago y enrolla.", timerSeconds: 180 },
      { stepNumber: 4, description: "Corta por la mitad y sirve.", timerSeconds: 60 }
    ],
    nutrition: { calories: 180, protein: 15, carbs: 6, fat: 11 },
    prepTimeMinutes: 15,
    estimatedCost: 50,
    difficulty: "fácil",
    ratings: { average: 4.4, count: 39 }
  }
];

async function seedDatabase() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nutricasa');
    console.log('📦 Conectado a MongoDB');

    // Limpiar la colección existente
    await Recipe.deleteMany({});
    console.log('🗑️ Colección de recetas limpiada');

    // Insertar las recetas
    const insertedRecipes = await Recipe.insertMany(recipes);
    console.log(`✅ ${insertedRecipes.length} recetas insertadas`);

    // Crear índices
    await Recipe.collection.createIndex({ category: 1 });
    await Recipe.collection.createIndex({ dietTypes: 1 });
    await Recipe.collection.createIndex({ estimatedCost: 1 });
    await Recipe.collection.createIndex({ prepTimeMinutes: 1 });
    await Recipe.collection.createIndex({ 'ratings.average': -1 });
    
    console.log('📊 Índices creados exitosamente');
    console.log('🌱 Seed completado con éxito');

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
  } finally {
    // Cerrar la conexión
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar el seed
seedDatabase();