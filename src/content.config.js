import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// One markdown file per tool. Frontmatter = metadata, body = teacher notes.
// Display order for course sections.
export const COURSES = ['Intro to Business', 'Personal Finance', 'Accounting', 'Marketing', 'Entrepreneurship', 'International Business'];

const tools = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tools' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    // First course is the tool's home section on the index page.
    // List every other course the tool fits so it can be cross-listed.
    courses: z.array(z.enum(COURSES)).min(1),
    unit: z.string(),
    grades: z.string().default('9–12'),
    // Class time for the activity, [low, high] in minutes. Shown on course pages.
    minutes: z.tuple([z.number(), z.number()]).optional(),
    // Key into src/components/tools/index.js
    component: z.string(),
    // Optional props passed to the component (e.g. which timer preset to load)
    props: z.record(z.string(), z.any()).default({}),
    order: z.number().default(100),
    draft: z.boolean().default(false),
    // Only list codes you have verified against the official MBA Research / CT documents.
    indicators: z
      .array(
        z.object({
          code: z.string(),
          name: z.string(),
          level: z.enum(['PQ', 'CS', 'SP', 'SU', 'MN', 'ON']),
        })
      )
      .default([]),
    // Other aligned standards (Jump$tart, CCSS, CSTA...), free text.
    alsoAligned: z.array(z.string()).default([]),
  }),
});

export const collections = { tools };
