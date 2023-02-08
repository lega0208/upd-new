import { PageData, TaskData, UxTestData } from '@dua-upd/external-data';
import { IPage, IProject, ITask, IUxTest } from '@dua-upd/types-common';

export type UxApiDataType = TaskData | UxTestData | PageData;
export interface UxApiData {
  tasksData: TaskData[];
  uxTestData: UxTestData[];
  pageData: PageData[];
  tasksTopicsMap: Record<string, number[]>;
}
export type UxDataType = ITask | IUxTest | IPage | IProject;
export interface UxData {
  tasks: ITask[];
  uxTests: IUxTest[];
  pages: IPage[];
  projects: IProject[];
}
