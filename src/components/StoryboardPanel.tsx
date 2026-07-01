import { ImageSquare } from "@phosphor-icons/react";
import type { Shot } from "../types";

const isUrl = (value = "") => /^https?:\/\//i.test(value);
const isAsset = (value = "") => value.startsWith("/");
export function StoryboardPanel({ shot }: { shot: Shot }) {
  const source = shot.storyboardImage;
  return <section className="storyboard">
    <div className="section-label">分鏡／參考圖 <span>（由匯入資料提供）</span></div>
    {source && (isUrl(source) || isAsset(source)) ? <img src={source} alt={`Scene ${shot.sceneNumber} Shot ${shot.shotNumber} 分鏡圖`} /> : <div className="storyboard-empty"><ImageSquare size={54} /><strong>No Storyboard Image</strong>{source && <span>Storyboard file: {source}</span>}</div>}
  </section>;
}
