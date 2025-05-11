import { BaseApi } from './baseApi';

export interface LogicBlockConfig {
    logic_block_id: number;
    operation_type: string;
    conection1_id: string;
    conection2_id: string;
}

const useLogicBlockApi = () => {
    const updateLogicBlock = async (config: LogicBlockConfig): Promise<void> => {
        return BaseApi.post('logical-ops', config);
    };

    return {
        updateLogicBlock
    };
};

export default useLogicBlockApi;