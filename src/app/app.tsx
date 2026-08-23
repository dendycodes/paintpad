"use client";
import React from "react";
import { RecoilRoot } from "recoil";
import BlackboardCore from "./core/blackboard-core";

export default function App() {
  return (
    <RecoilRoot>
      <BlackboardCore />
    </RecoilRoot>
  );
}
