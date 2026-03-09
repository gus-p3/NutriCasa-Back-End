

import { GoogleGenAI } from "@google/genai";
import { IUser } from "../../models/User.model";
import { IRecipe } from "../../models/Recipe.model";

export class IaRecipe {
    private ia = new GoogleGenAI({});

    async getRecipeIa(user: IUser, alacena: any, nutritionlogs: any, budgets:any, inventories:any ): Promise<IRecipe> {
        let iaReceta: IRecipe;

        const response = await this.ia.models.generateContent({
            model: "gemini-2.5-flash",
            contents: ``,
            config: {
                systemInstruction: `Eres una persona experta en la cocina y recetas con los mas altos valores 
                nutritivos dependiendo el tipo de dieta que llevan, pero ajustables al presupuesto de tus clientes,
                y usando cosas que tienen en su alacena`,
                temperature: 0.1,
                thinkingConfig: { thinkingBudget: 0 }
            }
        });
        const jsonMatch = response.text!.match(/\{[\s\S]*\}/);

        iaReceta = jsonMatch ? JSON.parse(jsonMatch[0]) : { receta: {}};

        return iaReceta;

    }


}