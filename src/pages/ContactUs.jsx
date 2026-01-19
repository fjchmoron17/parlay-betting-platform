import React, { useState, useEffect, useRef } from "react";

const ContactUs = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: ""
  });

  const [formStatus, setFormStatus] = useState({
    submitted: false,
    error: null
  });

  const timeoutRef = useRef(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.message) {
      setFormStatus({
        submitted: false,
        error: "Por favor, completa todos los campos requeridos."
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormStatus({
        submitted: false,
        error: "Por favor, ingresa un email válido."
      });
      return;
    }

    try {
      // TODO: Implement actual form submission to backend
      console.log("Form submitted:", formData);
      
      // Simulate successful submission
      setFormStatus({
        submitted: true,
        error: null
      });

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        message: ""
      });

      // Clear success message after 5 seconds
      timeoutRef.current = setTimeout(() => {
        setFormStatus({
          submitted: false,
          error: null
        });
      }, 5000);
    } catch (error) {
      setFormStatus({
        submitted: false,
        error: "Hubo un error al enviar el formulario. Por favor, intenta de nuevo."
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white py-16">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
            📞 Contáctanos
          </h1>
          <p className="text-xl text-center text-blue-100">
            ¿Interesado en trabajar con nosotros en tu próximo proyecto? ¡Conectémonos!
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-2 gap-8">
          {/* Contact Information */}
          <div className="card">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              📍 Información de Contacto
            </h2>
            
            <div className="space-y-6">
              {/* Email */}
              <div className="flex items-start gap-4">
                <div className="text-3xl">✉️</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                  <a 
                    href="mailto:contact@parlaybets.com" 
                    className="text-primary-main hover:text-primary-dark transition-colors"
                  >
                    contact@parlaybets.com
                  </a>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-4">
                <div className="text-3xl">📱</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Teléfono</h3>
                  <a 
                    href="tel:+15124222030" 
                    className="text-primary-main hover:text-primary-dark transition-colors"
                  >
                    +1 (512) 422-2030
                  </a>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-4">
                <div className="text-3xl">📍</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Ubicación</h3>
                  <p className="text-gray-600">
                    Austin, Texas<br />
                    United States
                  </p>
                </div>
              </div>

              {/* Hours */}
              <div className="flex items-start gap-4">
                <div className="text-3xl">🕐</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Horario de Atención</h3>
                  <p className="text-gray-600">
                    Lunes - Viernes: 9:00 AM - 6:00 PM CST<br />
                    Sábado - Domingo: Cerrado
                  </p>
                </div>
              </div>
            </div>

            {/* Social Media or Additional Info */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">
                💬 Tiempo de Respuesta
              </h3>
              <p className="text-gray-600 text-sm">
                Nos esforzamos por responder a todas las consultas dentro de las 24-48 horas hábiles. 
                Para asuntos urgentes, por favor llámanos directamente.
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="card">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              📝 Envíanos un Mensaje
            </h2>

            {formStatus.submitted && (
              <div className="alert alert-success mb-6">
                ✅ ¡Gracias por tu mensaje! Nos pondremos en contacto contigo pronto.
              </div>
            )}

            {formStatus.error && (
              <div className="alert alert-danger mb-6">
                ⚠️ {formStatus.error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid grid-2 gap-4 mb-4">
                <div className="form-group">
                  <label htmlFor="firstName">
                    Nombre <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="input-field"
                    required
                    placeholder="Juan"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">
                    Apellido <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="input-field"
                    required
                    placeholder="Pérez"
                  />
                </div>
              </div>

              <div className="form-group mb-4">
                <label htmlFor="email">
                  Email <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field"
                  required
                  placeholder="juan.perez@email.com"
                />
              </div>

              <div className="form-group mb-6">
                <label htmlFor="message">
                  Mensaje <span className="text-danger">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  className="textarea"
                  required
                  placeholder="Cuéntanos sobre tu proyecto o pregunta..."
                  rows="6"
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary btn-large w-full">
                📤 Enviar Mensaje
              </button>
            </form>

            <p className="text-sm text-gray-500 mt-4 text-center">
              Al enviar este formulario, aceptas nuestra política de privacidad.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
