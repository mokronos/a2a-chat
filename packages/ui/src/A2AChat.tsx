import React from "react";
import { MessageBox } from "./components/shared/message-box";
import { InputBox } from "./components/shared/input-box";

export function A2AChat() {
    return (
        <div className="flex h-96 w-full flex-col gap-4">
            <MessageBox />
            <InputBox />
        </div>
    );
}
