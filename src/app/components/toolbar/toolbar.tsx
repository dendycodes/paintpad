import React from "react";
import { useRecoilState } from "recoil";
import { ITool, ToolGroup } from "@/app/interfaces";
import { toolList } from "@/app/tools";
import { activeToolState } from "@/app/stores";
import { IconButton } from "../ui";
import { IconName } from "../icons";

const groupOrder: ToolGroup[] = ["navigate", "draw", "shape", "content"];

const grouped = groupOrder.map((group) => ({
  group,
  items: toolList.filter((tool) => tool.group === group)
}));

const Toolbar = () => {
  const [activeTool, setActiveTool] = useRecoilState(activeToolState);

  const renderTool = (tool: ITool) => (
    <IconButton
      key={tool.id}
      icon={tool.id as IconName}
      label={tool.label}
      shortcut={tool.shortcut}
      active={activeTool === tool.id}
      tip="right"
      onClick={() => setActiveTool(tool.id)}
    />
  );

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-30 flex justify-center px-3 md:inset-x-auto md:bottom-auto md:left-4 md:top-1/2 md:-translate-y-1/2">
      <div className="pp-panel pointer-events-auto pp-scroll flex max-w-full items-center gap-1 overflow-x-auto p-1.5 md:flex-col md:overflow-visible">
        {grouped.map(({ group, items }, index) => (
          <React.Fragment key={group}>
            {index > 0 ? (
              <>
                <span className="pp-divider hidden md:block" />
                <span className="pp-divider-v md:hidden" />
              </>
            ) : null}
            {items.map(renderTool)}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default Toolbar;
