import { PageData, TaskData, UxTestData } from '@dua-upd/external-data';
import { Page, Project, Task, UxTest } from '@dua-upd/db';

export type UxApiDataType = TaskData | UxTestData | PageData;
export interface UxApiData {
  tasksData: TaskData[];
  uxTestData: UxTestData[];
  pageData: PageData[];
  tasksTopicsMap: Record<string, number[]>;
}
export type UxDataType = Task | UxTest | Page | Project;
export interface UxData {
  tasks: Task[];
  uxTests: UxTest[];
  pages: Page[];
  projects: Project[];
}
