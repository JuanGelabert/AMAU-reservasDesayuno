import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import Swal from 'sweetalert2';

const sanitizarTexto = (str) => {
    return str
        .normalize("NFD") // Normalizar para separar diacríticos 
        .replace(/[\u0300-\u036f]/g, "") // Remover diacriticos 
        .toLowerCase(); // Convertir a minuscula
}

function ReservaForm() {
    const [bloquear, setBloquear] = useState(false);
    const [disponibilidad, setDisponibilidad] = useState({});
    const [defaultTurno, setDefaultTurno] = useState('7:00');
    const [initialValues, setInitialValues] = useState({
        habitacion: '',
        nombre: '',
        apellido: '',
        fecha: '',
        turno: defaultTurno,
        menuSinTacc: false,
        menuVegano: false,
        comentarios: ''
    })

    useEffect(() => {
        // Consulta si el formulario se encuentra bloqueado por admin
        axios.get('http://localhost:3000/api/bloqueo')
            .then(response => {
                setBloquear(response.data.bloquear);
            })
            .catch(error => {
                console.error('Error fetching bloqueo:', error);
            });
        
        // Recupera datos desde Local Sotrage
        const localData = localStorage.getItem('formData')
        if (localData) {
            const formData = JSON.parse(localData)
            setInitialValues({
                ...initialValues,
                nombre: formData.nombre,
                apellido: formData.apellido,
                menuSinTacc: formData.menuSinTacc,
                menuVegano: formData.menuVegano,
            })
        }
    }, [initialValues]);


    const validationSchema = Yup.object().shape({
        habitacion: Yup.number().required('La habitación es requerida'),
        nombre: Yup.string().required('El nombre es requerido'),
        apellido: Yup.string().required('El apellido es requerido'),
        fecha: Yup.date().required('La fecha es requerida'),
        turno: Yup.string().required('El turno es requerido')
    });

    const handleSubmit = (values, { setSubmitting, setFieldError, resetForm }) => {
        const selectedMenus = [];
        if (values.menuSinTacc) selectedMenus.push("Sin Tacc");
        if (values.menuVegano) selectedMenus.push("Vegano");

        const data = {
            habitacion: values.habitacion,
            nombre: sanitizarTexto(values.nombre),
            apellido: sanitizarTexto(values.apellido),
            fecha: values.fecha,
            turno: values.turno,
            menu: selectedMenus.join(", "),
            comentarios: values.comentarios
        };

        // Guardar datos en Local Storage
        localStorage.setItem('formData', JSON.stringify({
            nombre: values.nombre,
            apellido: values.apellido,
            menuSinTacc: values.menuSinTacc,
            menuVegano: values.menuVegano,
        }))

        axios.post('http://localhost:3000/api/reservar', data)
            .then(response => {
                if (response.data.message === 'La habitación no está ocupada por la persona indicada.') {
                    setFieldError('habitacion', 'La habitación y el huésped no coinciden.');
                    Swal.fire('Error', 'La habitación y el huésped no coinciden.', 'error');
                } else if (response.data.message === 'Ya tienes una reserva para esta fecha.') {
                    const horarioReservado = response.data.reserva.turno;
                    Swal.fire({
                        title: 'Reserva Existente',
                        text: `Ya tienes una reserva para este día a las ${horarioReservado}. ¿Deseas modificarla?`,
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonText: 'Sí, modificar',
                        cancelButtonText: 'No'
                    }).then((result) => {
                        if (result.isConfirmed) {

                            // Lógica para modificar la reserva
                            axios.put(`http://localhost:3000/api/reservar/${response.data.reserva._id}`, data)
                                .then(() => {
                                    Swal.fire('Modificado', 'Tu reserva ha sido modificada', 'success')
                                        .then(() => window.location.reload());
                                })
                                .catch(() => {
                                    Swal.fire('Error', 'Error al modificar la reserva', 'error');
                                });
                        }
                    });
                } else {
                    Swal.fire('Éxito', 'Reserva creada con éxito', 'success')
                        .then(() => window.location.reload());
                }
                setSubmitting(false);
            })
            .catch(error => {
                Swal.fire('Error', 'Error al crear la reserva', 'error');
                console.log(error);
                setSubmitting(false);
            });
    };

    const handleFechaChange = (event, setFieldValue) => {
        const { value } = event.target;
        setFieldValue('fecha', value);
        
        // Si no hay reservas, inicializar con valores por defecto
        const dayOfWeek = new Date(value).getDay();
        const defaultTurno = (dayOfWeek === 5 || dayOfWeek === 6) ? "8:00" : "7:00";
        setDefaultTurno(defaultTurno);
        setFieldValue('turno', defaultTurno);
        const defaultHorarios = dayOfWeek === 5 || dayOfWeek === 6 // Domingo o Sábado
            ? { "8:00": 24, "9:00": 24, "10:00": 24 }
            : { "7:00": 24, "8:00": 24, "9:00": 24 };

        // Consultar la disponibilidad al servidor para la fecha seleccionada
        axios.get(`http://localhost:3000/api/disponibilidad?fecha=${value}`)
        .then(response => {
                setDisponibilidad({ ...defaultHorarios, ...response.data });
            })
            .catch(error => {
                console.error('Error fetching disponibilidad:', error);
            });
    };

    if (bloquear) {
        return <p className="text-red-500 text-center font-bold text-lg">El sistema de reservas está actualmente bloqueado.</p>;
    }

    const sortedHorarios = Object.keys(disponibilidad).sort((a, b) => {
        const [aHour, aMinute] = a.split(':').map(Number);
        const [bHour, bMinute] = b.split(':').map(Number);
        return aHour - bHour || aMinute - bMinute;
    });

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Reservar Turno</h2>
            <Formik
                initialValues={initialValues}
                enableReinitialize
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
            >
                {({ isSubmitting, setFieldValue, values }) => (
                    <Form className="space-y-4">
                        <div>
                            <label className="block text-gray-700">Habitación:</label>
                            <Field type="number" name="habitacion" className="w-full p-2 border rounded" />
                            <ErrorMessage name="habitacion" component="div" className="text-red-500" />
                        </div>
                        <div>
                            <label className="block text-gray-700">Nombre:</label>
                            <Field type="text" name="nombre" autocomplete='given-name' className="w-full p-2 border rounded" />
                            <ErrorMessage name="nombre" component="div" className="text-red-500" />
                        </div>
                        <div>
                            <label className="block text-gray-700">Apellido:</label>
                            <Field type="text" name="apellido" autocomplete='family-name' className="w-full p-2 border rounded" />
                            <ErrorMessage name="apellido" component="div" className="text-red-500" />
                        </div>
                        <div>
                            <label className="block text-gray-700">Fecha:</label>
                            <Field type="date" name="fecha" className="w-full p-2 border rounded" onChange={(e) => handleFechaChange(e, setFieldValue)} />
                            <ErrorMessage name="fecha" component="div" className="text-red-500" />
                        </div>
                        <div>
                            <label className="block text-gray-700">Turno:</label>
                            <Field as="select" name="turno" className="w-full p-2 border rounded">
                                {values.fecha && sortedHorarios.map(horario => (
                                    <option key={horario} value={horario} disabled={disponibilidad[horario] <= 0}>
                                        {horario} ({disponibilidad[horario]} disponibles)
                                    </option>
                                ))}
                            </Field>
                            <ErrorMessage name="turno" component="div" className="text-red-500" />
                        </div>
                        <div>
                            <label className="block text-gray-700">Menú:</label>
                            <div className="flex items-center">
                                <Field type="checkbox" name="menuSinTacc" className="mr-2" />
                                <label className="mr-4">Sin Tacc</label>
                                <Field type="checkbox" name="menuVegano" className="mr-2" />
                                <label>Vegano</label>
                            </div>
                        </div>
                        <div>
                            <label className="block text-gray-700">Comentarios:</label>
                            <Field type="text" name="comentarios" className="w-full p-2 border rounded" />
                        </div>
                        <button type="submit" disabled={isSubmitting} className="w-full bg-blue-500 text-white p-2 rounded">Reservar</button>
                    </Form>
                )}
            </Formik>
        </div>
    );
}

export default ReservaForm;