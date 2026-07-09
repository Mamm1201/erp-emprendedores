import { NodeMark } from './NodeMark';

export function PortalHeader() {
  return (
    <header className="portal-header" role="banner">
      <NodeMark size={28} />
      <div className="portal-header-brand">
        <div className="portal-header-name">STECH NODES</div>
        <div className="portal-header-tag">Operaciones técnicas, bajo control.</div>
      </div>
    </header>
  );
}
