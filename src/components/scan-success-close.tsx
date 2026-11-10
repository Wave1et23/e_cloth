"use client";

import { useState } from "react";

/**
 * 系统相机打开的标签页通常不是脚本打开的，window.close() 会被浏览器拒绝。
 * 先尝试关闭；如果 300ms 后页面还在，同一个按钮改为「返回首页」并给出兜底说明。
 */
export function ScanSuccessClose() {
  const [closeFailed, setCloseFailed] = useState(false);

  function attemptClose() {
    window.close();
    window.setTimeout(() => setCloseFailed(true), 300);
  }

  if (closeFailed) {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <p className="muted" style={{ fontSize: 13, lineHeight: 1.7 }}>
          浏览器不允许自动关闭，请手动关闭此标签页，或点击下方按钮返回首页。
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => window.location.assign("/")}
        >
          返回首页
        </button>
      </div>
    );
  }

  return (
    <button type="button" className="btn btn-primary" onClick={attemptClose}>
      点此关闭网页
    </button>
  );
}
