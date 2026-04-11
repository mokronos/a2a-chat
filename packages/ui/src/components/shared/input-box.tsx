import React from "react";
import { ArrowUpIcon } from "lucide-react"

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

function InputBox({ children }: { children?: React.ReactNode }) {
    return (
        <div className="flex-1 flex flex-col gap-2">
            <Textarea />
            <Button variant="outline" size="icon">
            <ArrowUpIcon />
            </Button>
        </div>
    );
}

export { InputBox };
