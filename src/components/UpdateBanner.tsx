type UpdateBannerProps = {
  onUpdate: () => void
}

export function UpdateBanner({ onUpdate }: UpdateBannerProps) {
  return (
    <div className="install-banner" role="alert">
      <div className="install-banner-content">
        <p className="install-banner-text">
          <strong>Update available</strong>
          <span className="install-banner-sub">A new version is ready — refresh to update.</span>
        </p>
      </div>
      <div className="install-banner-actions">
        <button type="button" className="btn-teal" onClick={onUpdate}>
          Refresh
        </button>
      </div>
    </div>
  )
}
