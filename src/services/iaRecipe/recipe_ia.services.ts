import { GoogleGenAI } from '@google/genai';
import User from '../../models/User.model';
import Inventory from '../../models/Inventory.model';
import Recipe from '../../models/Recipe.model';

export class RecipeIaServices {
    private ai: GoogleGenAI | null = null;

    async generateRecipes(userId: string, userPrompt: string, count: number) {
        if (!this.ai) {
            this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        }

        const numRecipes = Math.min(Math.max(1, count), 3); // Max 3 recipes allowed

        const user = await User.findById(userId);
        if (!user) {
            throw new Error('Usuario no encontrado.');
        }

        const inventory = await Inventory.findOne({ userId });
        const inventoryItems = inventory ? inventory.items : [];

        // Construir el contexto para Gemini
        const userProfileText = `
Perfil Nutricional del Usuario:
- Edad: ${user.profile.age || 'No especificado'}
- Peso: ${user.profile.weight || 'No especificado'} kg
- Altura: ${user.profile.height || 'No especificado'} cm
- Nivel de actividad: ${user.profile.activityLevel}
- Objetivo: ${user.profile.goal}
- Tipo de dieta: ${user.profile.dietType}
- Alergias: ${user.profile.allergies.length > 0 ? user.profile.allergies.join(', ') : 'Ninguna'}
- Calorías diarias recomendadas: ${user.profile.dailyCalories} kcal
- Macros: Proteína ${user.profile.macros.protein}g, Carbohidratos ${user.profile.macros.carbs}g, Grasas ${user.profile.macros.fat}g
`;

        const inventoryText = inventoryItems.length > 0
            ? `Ingredientes disponibles en el inventario:\n${inventoryItems.map(item => `- ${item.name} (${item.quantity} ${item.unit})`).join('\n')}`
            : 'El usuario no tiene ingredientes registrados en su inventario. Debes sugerir recetas con ingredientes accesibles.';

        const systemPrompt = `
Eres un chef experto en nutrición de NutriCasa.
Tu tarea es generar exactamente ${numRecipes} receta(s) saludable(s) y diferente(s) en base al perfil nutricional del usuario y sus ingredientes disponibles, respetando sus alergias.

Petición del usuario: "${userPrompt || 'Quiero opciones nuevas saludables'}"

${userProfileText}

${inventoryText}

Retorna la respuesta ESTRICTAMENTE en formato JSON plano como un ARREGLO de objetos, sin backticks (\`\`\`), sin comentarios adicionales y que cada objeto cumpla exactamente la siguiente estructura de TypeScript:
[
  {
    "title": "string (máximo 100 caracteres)",
    "description": "string (máximo 500 caracteres, describe cómo esta receta ayuda a los objetivos del usuario)",
    "imageUrl": "string (URL generada dinámicamente usando https://image.pollinations.ai/prompt/{descripcion_del_platillo_en_ingles_alta_calidad_fotografica})",
    "category": "desayuno" | "comida" | "cena" | "snack",
    "dietTypes": ["normal" | "vegetarian" | "vegan"],
    "allergens": ["lista de alérgenos si los hay, string array"],
    "ingredients": [
      {
        "name": "string",
        "quantity": number,
        "unit": "string (ej: g, ml, piezas, tazas)",
        "alternatives": ["string array opcional"]
      }
    ],
    "steps": [
      {
        "stepNumber": number,
        "description": "string",
        "timerSeconds": number (opcional, en segundos si requiere tiempo exacto, o 0)
      }
    ],
    "nutrition": {
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number
    },
    "prepTimeMinutes": number,
    "estimatedCost": number (estimado en MXN, usa un número razonable),
    "difficulty": "fácil" | "media" | "difícil"
  }
]
Asegúrate de que tus cálculos nutricionales sumen aproximadamente las calorías de "nutrition.calories" y que los pasos e ingredientes sean coherentes. Prioriza los ingredientes del inventario del usuario. Si generas más de una, hazlas variadas.
`;

        // Llamar a Gemini
        const response = await this.ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: systemPrompt,
        });

        const responseText = response.text || '';
        
        let generatedRecipes;
        try {
            // Eliminar los backticks de markdown que suele agregar Gemini
            const jsonMatch = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            generatedRecipes = JSON.parse(jsonMatch);
            
            // Asegurarnos de que sea un array
            if (!Array.isArray(generatedRecipes)) {
                generatedRecipes = [generatedRecipes];
            }
        } catch (e) {
            console.error('Error parseando JSON de Gemini:', responseText);
            throw new Error('Error generando las recetas. Fallo al interpretar respuesta de IA.');
        }

        return generatedRecipes;
    }

    async saveRecipe(recipeData: any) {
        if (!recipeData || !recipeData.title) {
            throw new Error('Datos de receta inválidos.');
        }

        // Validar si ya existe
        const existingRecipe = await Recipe.findOne({ title: recipeData.title });
        if (existingRecipe) {
            return {
                isNew: false,
                recipe: existingRecipe
            };
        }

        const newRecipe = new Recipe(recipeData);
        await newRecipe.save();

        return {
            isNew: true,
            recipe: newRecipe
        };
    }
}