import React from 'react';
import { SelectControl } from '@controls/select-control/select-control';
import './logic-block.css';

const logicBlockTypes = ['AND', 'NAND', 'OR', 'NOR', 'XOR', 'XNOR', 'OFF'];
const logicConnectionsTypes = ['1', '2', '3', '4', 'L1', 'L2', 'L3', 'OFF'];

interface LogicBlockProps {
    onBlockTypeChange?: (id: string | undefined, index: number, value: boolean) => void;
    onConnectionTypeChange?: (id: string | undefined, index: number, value: boolean) => void;
}

const LogicBlock: React.FC<LogicBlockProps> = ({
    onBlockTypeChange,
    onConnectionTypeChange
}) => {
    return (
        <div className="logic-block-section">
            <div className="title">LOP 1</div>
            <div className="logic-block">
                <SelectControl
                    id="connection-type"
                    labels={logicConnectionsTypes}
                    mode="single"
                    onChange={onConnectionTypeChange}
                />
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

