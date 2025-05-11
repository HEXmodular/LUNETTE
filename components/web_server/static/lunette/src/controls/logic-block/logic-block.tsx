import React, { useState } from 'react';
import { SelectControl } from '@controls/select-control/select-control';
import type { LogicBlockConfig } from '@api/logicBlockApi';

import './logic-block.css';

const logicBlockTypes = ['AND', 'NAND', 'OR', 'NOR', 'XOR', 'XNOR', 'OFF'];
const logicConnectionsTypes = ['1', '2', '3', '4', 'L1', 'L2', 'L3', 'OFF'];

interface LogicBlockProps {
    id: number;
    title?: string;
    onBlockChange: (data: LogicBlockConfig) => void;
}

const LogicBlock: React.FC<LogicBlockProps> = ({
    id,
    title,
    onBlockChange,
}) => {
    const [blockType, setBlockType] = useState<string>(logicBlockTypes[0]);
    const [connection1Id, setConnection1Id] = useState<string>(logicConnectionsTypes[0]);
    const [connection2Id, setConnection2Id] = useState<string>(logicConnectionsTypes[0]);

    const handleChange = () => {
        const data = {
            logic_block_id: id,
            operation_type: blockType,
            conection1_id: connection1Id,
            conection2_id: connection2Id
        }

        onBlockChange(data);
    }

    const onConnectionTypeChange = (id: string, index: number, value: boolean) => {
        if (!value) {
            return;
        }

        if (id === '1') {
            setConnection1Id(logicConnectionsTypes[index]);
        } else {
            setConnection2Id(logicConnectionsTypes[index]);
        }
        handleChange();
    }



    const onBlockTypeChange = (_: any, index: number, value: boolean) => {
        if (!value) {
            return;
        }

        setBlockType(logicBlockTypes[index]);
        handleChange();
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
                        onChange={onConnectionTypeChange}
                    />
                </div>
                <div className="logic-block">
                    <SelectControl
                        id="2"
                        labels={logicConnectionsTypes}
                        mode="single"
                        columns={2}
                        onChange={onConnectionTypeChange}
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
                        onChange={onBlockTypeChange}
                    />
                </div>
            </div>
        </div>
    );
};

export default LogicBlock;

