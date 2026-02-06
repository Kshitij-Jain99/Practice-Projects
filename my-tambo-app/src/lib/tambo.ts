/**
 * @file tambo.ts
 * @description Central configuration file for Tambo components and tools
 *
 * This file serves as the central place to register your Tambo components and tools.
 * It exports arrays that will be used by the TamboProvider.
 *
 * Read more about Tambo at https://tambo.co/docs
 */

import { Graph, graphSchema } from "@/components/tambo/graph";
import { DataCard, dataCardSchema } from "@/components/ui/card-data";
import {
  getCountryPopulations,
  getGlobalPopulationTrend,
} from "@/services/population-stats";
import type { TamboComponent } from "@tambo-ai/react";
import RecipeCard from "@/components/recipe-card";
import { TamboTool } from "@tambo-ai/react";
import { z } from "zod";

/**
 * tools
 *
 * This array contains all the Tambo tools that are registered for use within the application.
 * Each tool is defined with its name, description, and expected props. The tools
 * can be controlled by AI to dynamically fetch data based on user interactions.
 */

export const tools: TamboTool[] = [
  {
    name: "countryPopulation",
    description:
      "A tool to get population statistics by country with advanced filtering options",
    tool: getCountryPopulations,
    inputSchema: z.object({
      continent: z.string().optional(),
      sortBy: z.enum(["population", "growthRate"]).optional(),
      limit: z.number().optional(),
      order: z.enum(["asc", "desc"]).optional(),
    }),
    outputSchema: z.array(
      z.object({
        countryCode: z.string(),
        countryName: z.string(),
        continent: z.enum([
          "Asia",
          "Africa",
          "Europe",
          "North America",
          "South America",
          "Oceania",
        ]),
        population: z.number(),
        year: z.number(),
        growthRate: z.number(),
      }),
    ),
  },
  {
    name: "globalPopulation",
    description:
      "A tool to get global population trends with optional year range filtering",
    tool: getGlobalPopulationTrend,
    inputSchema: z.object({
      startYear: z.number().optional(),
      endYear: z.number().optional(),
    }),
    outputSchema: z.array(
      z.object({
        year: z.number(),
        population: z.number(),
        growthRate: z.number(),
      }),
    ),
  },
  // Add more tools here
    {
    name: "get-available-ingredients",
    description:
      "Get a list of all the available ingredients that can be used in a recipe.",
    tool: () => [
      "pizza dough",
      "mozzarella cheese",
      "tomatoes",
      "basil",
      "olive oil",
      "chicken breast",
      "ground beef",
      "onions",
      "garlic",
      "bell peppers",
      "mushrooms",
      "pasta",
      "rice",
      "eggs",
      "bread",
    ],
    inputSchema: z.object({}),
    outputSchema: z.array(z.string()),
  },
];

/**
 * components
 *
 * This array contains all the Tambo components that are registered for use within the application.
 * Each component is defined with its name, description, and expected props. The components
 * can be controlled by AI to dynamically render UI elements based on user interactions.
 */
export const components: TamboComponent[] = [
  {
    name: "Graph",
    description:
      "A component that renders various types of charts (bar, line, pie) using Recharts. Supports customizable data visualization with labels, datasets, and styling options.",
    component: Graph,
    propsSchema: graphSchema,
  },
  {
    name: "DataCard",
    description:
      "A component that displays options as clickable cards with links and summaries with the ability to select multiple items.",
    component: DataCard,
    propsSchema: dataCardSchema,
  },
  // Add more components here
    {
    name: "RecipeCard",
    description: "A component that renders a recipe card",
    component: RecipeCard,
    propsSchema: z.object({
      title: z.string().describe("The title of the recipe"),
      description: z.string().describe("The description of the recipe"),
      prepTime: z.number().describe("The prep time of the recipe in minutes"),
      cookTime: z.number().describe("The cook time of the recipe in minutes"),
      originalServings: z
        .number()
        .describe("The original servings of the recipe"),
      ingredients: z
        .array(
          z.object({
            name: z.string().describe("The name of the ingredient"),
            amount: z.number().describe("The amount of the ingredient"),
            unit: z.string().describe("The unit of the ingredient"),
          })
        )
        .describe("The ingredients of the recipe"),
    }),
  },
];
