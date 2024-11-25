const translations = {
    es: {
      titulo: "Reservar Turno",
      habitacion: "Habitación",
      nombre: "Nombre",
      apellido: "Apellido",
      fecha: "Fecha",
      turno: "Turno",
      menuSinTacc: "Sin TACC",
      menuVegano: "Vegano",
      comentarios: "Comentarios",
      enviar: "Reservar"
    },
    en: {
      titulo: "Book Appointment",
      habitacion: "Room",
      nombre: "First Name",
      apellido: "Last Name",
      fecha: "Date",
      turno: "Shift",
      menuSinTacc: "Gluten-Free",
      menuVegano: "Vegan",
      comentarios: "Comments",
      enviar: "Submit"
    },
    pt: {
      titulo: "Reservar Turno",
      habitacion: "Quarto",
      nombre: "Nome",
      apellido: "Sobrenome",
      fecha: "Data",
      turno: "Turno",
      menuSinTacc: "Sem Glúten",
      menuVegano: "Vegano",
      comentarios: "Comentários",
      enviar: "Enviar"
    }
  };
  
  export const getTranslation = (lang) => translations[lang] || translations.en;  