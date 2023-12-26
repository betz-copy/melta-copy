import axios from '../axios';
import { environment } from '../globals';
import { IBasicGantt, IGantt, ISearchGanttsBody } from '../interfaces/gantts';

const { gantts } = environment.api;

export const searchGantts = async (query: ISearchGanttsBody) => {
    const { data } = await axios.post<IGantt[]>(`${gantts}/search`, query);
    return data;
};

export const getGanttById = async (id: string) => {
    const { data } = await axios.get<IGantt>(`${gantts}/${id}`);
    return data;
};

export const createGantt = async (gantt: IBasicGantt) => {
    const { data } = await axios.post<IGantt>(gantts, gantt);
    return data;
};

export const deleteGantt = async (ganttId: string) => {
    const { data } = await axios.delete<IGantt>(`${gantts}/${ganttId}`);
    return data;
};

export const updateGantt = async (id: string, gantt: IBasicGantt) => {
    const { data } = await axios.put<IGantt>(`${gantts}/${id}`, gantt);
    return data;
};
