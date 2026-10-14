// Registry: maps the `component` field in a tool's frontmatter to its Astro component.
// To add a tool: create the component, import it here, and add a markdown file in src/content/tools/.
import BreakEven from './BreakEven.astro';
import ClassTimer from './ClassTimer.astro';

export const TOOL_COMPONENTS = {
  BreakEven,
  ClassTimer,
};
