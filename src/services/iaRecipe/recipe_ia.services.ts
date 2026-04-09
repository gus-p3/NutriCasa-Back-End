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

        const numRecipes = Math.min(Math.max(1, count), 3);

        const user = await User.findById(userId);
        if (!user) {
            throw new Error('Usuario no encontrado.');
        }

        const inventory = await Inventory.findOne({ userId });
        const inventoryItems = inventory?.items || [];

        const userProfileText = `
Perfil Nutricional del Usuario:
- Edad: ${user.profile?.age || 'No especificado'}
- Peso: ${user.profile?.weight || 'No especificado'} kg
- Altura: ${user.profile?.height || 'No especificado'} cm
- Nivel de actividad: ${user.profile?.activityLevel || 'No especificado'}
- Objetivo: ${user.profile?.goal || 'No especificado'}
- Tipo de dieta: ${user.profile?.dietType || 'No especificado'}
- Alergias: ${user.profile?.allergies?.length ? user.profile.allergies.join(', ') : 'Ninguna'}
- Calorías diarias recomendadas: ${user.profile?.dailyCalories || 'No especificado'} kcal
- Macros: Proteína ${user.profile?.macros?.protein || 0}g, Carbohidratos ${user.profile?.macros?.carbs || 0}g, Grasas ${user.profile?.macros?.fat || 0}g
`;

        const inventoryText = inventoryItems.length > 0
            ? `Ingredientes disponibles en el inventario:\n${inventoryItems.map((item: any) => `- ${item.name} (${item.quantity} ${item.unit})`).join('\n')}`
            : 'El usuario no tiene ingredientes registrados en su inventario. Debes sugerir recetas con ingredientes accesibles.';

        const userPromptText = userPrompt?.trim() || 'Quiero opciones nuevas saludables';

        const systemPrompt = `
Eres un chef experto en nutrición de NutriCasa.
Tu tarea es generar exactamente ${numRecipes} receta(s) saludable(s) y diferente(s) en base al perfil nutricional del usuario y sus ingredientes disponibles, respetando sus alergias.

Petición del usuario: "${userPromptText}"

${userProfileText}

${inventoryText}

Retorna la respuesta ESTRICTAMENTE en formato JSON plano como un ARREGLO de objetos, sin backticks, sin comentarios adicionales y que cada objeto cumpla exactamente la siguiente estructura:

[
  {
    "title": "string (máximo 100 caracteres)",
    "description": "string (máximo 500 caracteres)",
    "imageUrl": "string (URL generada con https://image.pollinations.ai/prompt/{descripcion_en_ingles})",
    "category": "desayuno" | "comida" | "cena" | "snack",
    "dietTypes": ["normal" | "vegetarian" | "vegan"],
    "allergens": ["string"],
    "ingredients": [
      {
        "name": "string",
        "quantity": number,
        "unit": "string",
        "alternatives": ["string"]
      }
    ],
    "steps": [
      {
        "stepNumber": number,
        "description": "string",
        "timerSeconds": number
      }
    ],
    "nutrition": {
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number
    },
    "prepTimeMinutes": number,
    "estimatedCost": number,
    "difficulty": "fácil" | "media" | "difícil"
  }
]

Asegúrate de que los cálculos nutricionales sean coherentes. Prioriza los ingredientes del inventario del usuario.
`;

        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
            });

            const responseText = response.text || '';

            let cleanText = responseText
                .replace(/```json/g, '')
                .replace(/```/g, '')
                .trim();

            const generatedRecipes = JSON.parse(cleanText);

            const recipesArray = Array.isArray(generatedRecipes) ? generatedRecipes : [generatedRecipes];

            return recipesArray.slice(0, numRecipes);

        } catch (error: any) {
            console.error('Error en generateRecipes:', error.message);
            throw new Error(`Error generando las recetas: ${error.message}`);
        }
    }

    async saveRecipe(recipeData: any) {
        if (!recipeData || !recipeData.title) {
            throw new Error('Datos de receta inválidos.');
        }

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

    async chatWithAssistant(userId: string, history: any[], message: string) {
        if (!this.ai) {
            this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        }

        const user = await User.findById(userId);
        const name = user?.name || 'Usuario';

        const systemPrompt = `
# Contexto General del Sistema: NutriCasa

**Nombre de la Aplicación:** NutriCasa
**Objetivo Principal:** NutriCasa es una plataforma integral de gestión alimentaria diseñada para ayudar a los usuarios a administrar las existencias de su alacena, descubrir recetas, seguir instrucciones paso a paso para cocinar y llevar un registro detallado de su consumo nutricional y económico.

## Rol del Asistente
Eres el "Asistente Virtual de NutriCasa". Tu objetivo es guiar, ayudar y resolver las dudas de los usuarios mientras navegan por la aplicación. Tienes que ser amigable, claro, conciso y motivador.

## Flujos y Secciones Principales

### 1. Autenticación (Login y Registro)
- Registro de nuevos usuarios con datos personales
- Inicio de sesión con correo y contraseña

### 2. Dashboard (Inicio) - Ruta: /inicio
Pantalla principal con resumen de actividad, recomendaciones y accesos directos

### 3. Mi Alacena (Inventario) - Ruta: /inventory
Gestión de ingredientes en casa. CRUD completo de productos con cantidades y unidades.

### 4. Recetas (Explorar) - Ruta: /recipes
Catálogo de recetas con filtros. Al seleccionar una, se muestra detalle nutricional y se compara con el inventario.

### 5. Modo Cocinar - Ruta: /recipes/:id/cook
Experiencia guiada paso a paso. Al finalizar, descuenta ingredientes y guarda en historial.

### 6. Historial - Ruta: /history
Registro de recetas cocinadas con:
- Grid de tarjetas con imagen, clasificación, rating y fecha
- KPIs: total recetas, rating promedio, calorías totales, gasto total
- Filtros por tipo de comida y rating mínimo
- Ordenamiento por fecha, rating o calorías
- Modal de detalle con opción de guardar sobrantes al inventario

### 7. AI Dashboard - Ruta: /ai-dashboard
Generador de recetas con IA. Permite crear recetas personalizadas mediante prompts y guardarlas en la plataforma.

## Directrices de Interacción
1. Cuando el usuario no sepa qué comer: sugiere /recipes o /ai-dashboard
2. Para sobrantes: recomienda usar el botón "Guardar sobrantes" en /history
3. Mantén un tono amigable, claro y motivador
4. Ayuda con navegación y resolución de dudas
`;

        try {
            const contents: any[] = [];

            if (!history || history.length === 0) {
                contents.push({
                    role: 'user',
                    parts: [{ text: `Eres un asistente de NutriCasa. ${systemPrompt}\n\nEl usuario se llama ${name}. Salúdalo cordialmente y preséntate.` }]
                });
            } else {
                for (const msg of history) {
                    contents.push({
                        role: msg.role === 'bot' ? 'model' : 'user',
                        parts: [{ text: msg.text }]
                    });
                }
            }

            contents.push({
                role: 'user',
                parts: [{ text: message }]
            });

            const response = await this.ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: contents,
            });

            return response.text || "Lo siento, hubo un problema al procesar tu mensaje. ¿Podrías intentarlo de nuevo?";

        } catch (error: any) {
            console.error('Error en chatWithAssistant:', error.message);
            return "Lo siento, estoy teniendo problemas para conectarme. Por favor, intenta de nuevo en unos momentos.";
        }
    }
}      