import axios from '../axios';
import { environment } from '../globals';
import { IGantt, ISearchGanttsBody } from '../interfaces/gantts';

const { gantts } = environment.api;

export const searchGantts = async (query: ISearchGanttsBody) => {
    const { data } = await axios.post<IGantt[]>(`${gantts}/search`, query);
    return data;
};

export const getGanttById = async (id: string) => {
    const { data } = await axios.get<IGantt>(`${gantts}/${id}`);
    return data;
};

export const createGantt = async (gantt: IGantt) => {
    const { data } = await axios.post<IGantt>(gantts, gantt);
    return data;
};

export const deleteGantt = async (ganttId: string) => {
    const { data } = await axios.delete<IGantt>(`${gantts}/${ganttId}`);
    return data;
};

export const updateGantt = async (ganttId: string, gantt: IGantt) => {
    const { data } = await axios.put<IGantt>(`${gantts}/${ganttId}`, gantt);
    return data;
};
