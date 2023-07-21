import { AgentTask } from '@/types';
import { Skill } from '../skill';

export class CodeReader extends Skill {
  static skillName = 'code_reader';
  static skillDescriptionForHuman =
    "A skill that finds a file's location in its own program's directory and returns its contents.";
  static skillDescriptionForModel =
    "A skill that finds a file's location in its own program's directory and returns its contents.";
  static skillIcon = '📖';
  static skillType = 'dev';
  apiKeysRequired = ['openai'];

  async execute(
    task: AgentTask,
    dependentTaskOutputs: string,
    objective: string,
  ): Promise<string> {
    if (!this.valid) return '';

    const dirStructure = await this.getDirectoryStructure();
    console.log(`Directory structure: ${JSON.stringify(dirStructure)}`);

    const prompt = `Find a specific file in a directory and return only the file path, based on the task description below. Always return a directory.###
    The directory structure of src is as follows: \n${JSON.stringify(
      dirStructure,
    )}\
    Your task: ${task.task}\n###\nRESPONSE:`;
    let filePath = await this.generateText(prompt, task, { temperature: 0.2 });

    console.log(`AI suggested file path: ${filePath}`);

    try {
      const response = await fetch(
        `/api/local/read-file?filename=${encodeURIComponent(filePath)}`,
        {
          method: 'GET',
        },
      );
      if (!response.ok) {
        throw new Error('Failed to read file');
      }
      const fileContent = await response.json();
      console.log(`File content:\n${JSON.stringify(fileContent)}`);
      return JSON.stringify(fileContent);
    } catch (error) {
      console.error(
        "File not found. Please check the AI's suggested file path.",
        error,
      );
      return "File not found. Please check the AI's suggested file path.";
    }
  }

  async getDirectoryStructure(): Promise<any> {
    const response = await fetch('/api/local/directory-structure', {
      method: 'GET',
    });
    if (!response.ok) {
      throw new Error('Failed to get directory structure');
    }
    return await response.json();
  }
}
