import { BaseApi } from './baseApi';

export interface LogicBlockConfig {
    logic_block_id: number;
    operation_type: string;
    input1_id: number;
    input1_type: string;
    input2_id: number;
    input2_type: string;
}

interface LogicBlockResponse {
    logical_ops: LogicBlockConfig[];
}

const useLogicBlockApi = () => {

    const getLogicBlocks = async () => {
        return await BaseApi.get<LogicBlockResponse>('logical-ops').then((data) => data.logical_ops);
    };

    const updateLogicBlock = async (config: LogicBlockConfig): Promise<void> => {
        return BaseApi.post('logical-ops', config);
    };

    return {
        updateLogicBlock,
        getLogicBlocks,
    };
};

export default useLogicBlockApi;