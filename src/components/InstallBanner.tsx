import catFaceSvg from '../assets/icons/cat-face.svg'

type InstallBannerProps = {
  onInstall: () => void
  onDismiss: () => void
}

export function InstallBanner({ onInstall, onDismiss }: InstallBannerProps) {
  return (
    <div className="install-banner" role="alert">
      <div className="install-banner-content">
        <img src={catFaceSvg} alt="" className="install-banner-icon" />
        <p className="install-banner-text">
          <strong>Install Word Paws</strong>
          <span className="install-banner-sub">Cozy puzzling, even offline.</span>
        </p>
      </div>
      <div className="install-banner-actions">
        <button type="button" className="btn-teal" onClick={onInstall}>
          Install
        </button>
        <button type="button" className="btn-outline" onClick={onDismiss}>
          Not now
        </button>
      </div>
    </div>
  )
}
