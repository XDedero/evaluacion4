import { useCallback, useEffect, useState } from 'react'

function ProductDetailModal({ product, onClose }) {
  const [currentImage, setCurrentImage] = useState(0)
  const images = product.images || []

  const goToPrev = useCallback(() => {
    setCurrentImage((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }, [images.length])

  const goToNext = useCallback(() => {
    setCurrentImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }, [images.length])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      } else if (event.key === 'ArrowLeft') {
        goToPrev()
      } else if (event.key === 'ArrowRight') {
        goToNext()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, goToPrev, goToNext])

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true">
      <div className="modal-container">
        <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">
          &times;
        </button>

        <div className="modal-layout">
          <div className="modal-carousel">
            <div className="carousel-viewport">
              <div className="carousel-placeholder">
                <div className="placeholder-icon">&#128247;</div>
                <span>Imagen {currentImage + 1} de {images.length}</span>
              </div>
            </div>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className="carousel-arrow carousel-prev"
                  onClick={goToPrev}
                  aria-label="Imagen anterior"
                >
                  &#10094;
                </button>
                <button
                  type="button"
                  className="carousel-arrow carousel-next"
                  onClick={goToNext}
                  aria-label="Imagen siguiente"
                >
                  &#10095;
                </button>

                <div className="carousel-dots">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`carousel-dot ${index === currentImage ? 'active' : ''}`}
                      onClick={() => setCurrentImage(index)}
                      aria-label={`Ver imagen ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="modal-details">
            <div className="modal-header">
              <span className="badget">{product.category}</span>
              <h2>{product.name}</h2>
              <p className="modal-stock">
                Stock disponible: <strong>{product.stock}</strong> unidades
              </p>
            </div>

            <div className="modal-specs">
              <h3>Especificaciones tecnicas</h3>
              <table className="specs-table">
                <tbody>
                  {(product.specs || []).map((spec, index) => (
                    <tr key={index}>
                      <td className="spec-label">{spec.label}</td>
                      <td className="spec-value">{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetailModal