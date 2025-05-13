import React, { useEffect, useState } from 'react';
import { SelectControl } from '@controls/select-control/select-control';
import type { LogicBlockConfig } from '@api/logicBlockApi';

import './algorithm-block.css';

const logicBlockTypes = ['AND', 'NAND', 'OR', 'NOR', 'XOR', 'XNOR', 'OFF'];
const serverLogicBlockTypes = ['LOGICAL_OP_AND', 'LOGICAL_OP_NAND', 'LOGICAL_OP_OR', 'LOGICAL_OP_NOR', 'LOGICAL_OP_XOR', 'LOGICAL_OP_XNOR', 'LOGICAL_OP_OFF'];
const logicConnectionsTypes = ['1', '2', '3', '4', 'L1', 'L2', 'L3', 'OFF'];

interface AlgorithmBlockProps {
    id: number;
    title?: string;
    config?: LogicBlockConfig;
    disabled?: boolean;
    onBlockChange: (data: LogicBlockConfig) => void;
}

const AlgorithmBlock: React.FC<AlgorithmBlockProps> = ({
    id,
    title,
    config,
    disabled,
    onBlockChange,
}) => {
    const [blockType, setBlockType] = useState<number>(0);
    const [input1Id, setInput1Id] = useState<number>(0);
    const [input2Id, setInput2Id] = useState<number>(0);
    const [input1Type, setInput1Type] = useState<string>(config?.input1_type || '');
    const [input2Type, setInput2Type] = useState<string>(config?.input2_type || '');
    const [disabledState, setDisabledState] = useState<boolean>(disabled || false);

    useEffect(() => {
        setDisabledState(disabled || false);
    }, [disabled]);

    useEffect(() => {
        if (!config) {
            return;
        }

        const input1Value = config?.input1_id;
        const input2Value = config?.input2_id;
        const blockTypeValue = serverLogicBlockTypes.indexOf(config?.operation_type || serverLogicBlockTypes[0]);

        setBlockType(blockTypeValue);
        setInput1Id(input1Value);
        setInput2Id(input2Value);
        setInput1Type(config?.input1_type);
        setInput2Type(config?.input2_type);
    }, [config]);

    useEffect(() => {
        handleChange();
    }, [input1Id, input2Id, blockType, input1Type, input2Type]);

    const handleChange = () => {
        const data = {
            logic_block_id: id,
            operation_type: serverLogicBlockTypes[blockType],
            input1_id: input1Id,
            input1_type: input1Type,
            input2_id: input2Id,
            input2_type: input2Type
        }

        if (!disabled) {
            onBlockChange(data);
        }
    }

    const onConnectionTypeChange = (id: string, index: number, value: boolean) => {
        if (!value) {
            return;
        }

        if (id == '1') {
            setInput1Id(index);
        } else {
            setInput2Id(index);
        }
    }

    const onBlockTypeChange = (_: any, index: number, value: boolean) => {
        if (!value) {
            return;
        }

        setBlockType(index);
    }

    return (
        <div className="logic-block-section">
            <div className="title">{title}</div>
            <div className="connection-block">
                <div className="logic-block">
                    <SelectControl
                        id="1"
                        labels={logicConnectionsTypes}
                        mode="single"
                        columns={2}
                        value={input1Id}
                        onChange={onConnectionTypeChange}
                        disabled={disabledState}
                    />
                </div>
                <div className="logic-block">
                    <SelectControl
                        id="2"
                        labels={logicConnectionsTypes}
                        mode="single"
                        columns={2}
                        value={input2Id}
                        onChange={onConnectionTypeChange}
                        disabled={disabledState}
                    />
                </div>
            </div>

            <div className="arrow-down-container">
                <div className="arrow-down">↓</div>
                <div className="arrow-down">↓</div>
            </div>
            <div className="logic-block">
                <div className="logic-block-section">
                    <SelectControl
                        id="block-type"
                        labels={logicBlockTypes}
                        mode="single"
                        value={blockType}
                        onChange={onBlockTypeChange}
                        disabled={disabledState}
                    />
                </div>
            </div>
        </div>
    );
};

export default AlgorithmBlock;

