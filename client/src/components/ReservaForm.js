import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import Swal from 'sweetalert2';
import { getTranslation } from '../i18n/i18n'

const sanitizarTexto = (str) => {
    return str
        .normalize("NFD") // Normalizar para separar diacríticos 
        .replace(/[\u0300-\u036f]/g, "") // Remover diacriticos 
        .toLowerCase(); // Convertir a minuscula
}

const detectarIdiomaNavegador = () => {
    const lang = navigator.language || navigator.userLanguage
    return lang.substring(0, 2)
}

function ReservaForm() {
    const [bloquear, setBloquear] = useState(false);
    const [disponibilidad, setDisponibilidad] = useState({});
    const [defaultTurno, setDefaultTurno] = useState('7:00');
    const idioma = detectarIdiomaNavegador()
    const traducciones = getTranslation(idioma)
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
            }).catch(error => {
                console.error('Error fetching bloqueo:', error);
            });
    }, []);

    useEffect(() => {
        // Recupera datos desde Local Storage
        const localData = localStorage.getItem('formData');
        if (localData) {
            const formData = JSON.parse(localData);
            setInitialValues(prevValues => ({
                ...prevValues,
                nombre: formData.nombre,
                apellido: formData.apellido,
                menuSinTacc: formData.menuSinTacc,
                menuVegano: formData.menuVegano,
            }));
        }
    }, []);

    const validationSchema = Yup.object().shape({
        habitacion: Yup.number().required('La habitación es requerida'),
        nombre: Yup.string().required('El nombre es requerido'),
        apellido: Yup.string().required('El apellido es requerido'),
        fecha: Yup.date().required('La fecha es requerida'),
        turno: Yup.string().required('El turno es requerido')
    });

    const handleSubmit = (values, { setSubmitting, setFieldError}) => {
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
                    setFieldError('habitacion', 'No se encuentra el huésped en la habitación indicada.');
                    Swal.fire('Error', 'La habitación y el huésped no coinciden.', 'error');
                } else if (response.data.message === 'Ya tienes una reserva para esta fecha.') {
                    const horarioReservado = response.data.reserva.turno;
                    Swal.fire({
                        icon: 'warning',
                        title: 'Reserva Existente',
                        text: `Ya tienes una reserva para este día a las ${horarioReservado}. ¿Deseas modificarla?`,
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
        <>
            <div className='text-center'>
                <h2 className='font-semibold text-lg mb-4'>¡Bienvenidos al Hotel AMAU!</h2>
                <p>
                    Asegúrese de completar el siguiente formulario para reservar el turno de los desayunos durante su estadía.<br />
                    Recuerde que el servicio se brinda en intervalos de 45 minutos y los horarios son los siguientes:
                </p>
                <br />
                <ul>
                    <li><strong>Lunes a Viernes:</strong> 7:00 | 8:00 | 9:00 am</li>
                    <li><strong>Sábados y Domingos:</strong> 8:00 | 9:00 | 10:00 am</li>
                </ul>
                <br />
                <p>En caso de necesitar un turno extra puede solicitarlo en recepción.</p>
                <p className='font-semibold italic'>Gracias por elegirnos, ¡esperamos que disfrute de su estadía!</p>
            </div>
            <div className="max-w-md mx-auto mt-5 p-6 bg-[#FAFAFA] rounded-lg shadow-md">
                <h2 className="text-2xl text-center font-bold mb-4">{traducciones.titulo}</h2>
                <Formik
                    initialValues={initialValues}
                    enableReinitialize
                    validationSchema={validationSchema}
                    onSubmit={handleSubmit}
                >
                    {({ isSubmitting, setFieldValue, values }) => (
                        <Form className="space-y-4">
                            <div>
                                <label className="block font-semibold text-gray-700">{traducciones.habitacion}:</label>
                                <Field type="number" name="habitacion" className="w-full p-2 border rounded" />
                                <ErrorMessage name="habitacion" component="div" className="text-red-500" />
                            </div>
                            <div>
                                <label className="block font-semibold text-gray-700">{traducciones.nombre}:</label>
                                <Field type="text" name="nombre" autoComplete='given-name' className="w-full p-2 border rounded" />
                                <ErrorMessage name="nombre" component="div" className="text-red-500" />
                            </div>
                            <div>
                                <label className="block font-semibold text-gray-700">{traducciones.apellido}:</label>
                                <Field type="text" name="apellido" autoComplete='family-name' className="w-full p-2 border rounded" />
                                <ErrorMessage name="apellido" component="div" className="text-red-500" />
                            </div>
                            <div>
                                <label className="block font-semibold text-gray-700">{traducciones.fecha}:</label>
                                <Field type="date" name="fecha" className="w-full p-2 border rounded" onChange={(e) => handleFechaChange(e, setFieldValue)} />
                                <ErrorMessage name="fecha" component="div" className="text-red-500" />
                            </div>
                            <div>
                                <label className="block font-semibold text-gray-700">{traducciones.turno}:</label>
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
                                <label className="block font-semibold text-gray-700">Menú:</label>
                                <div className="flex items-center font-semibold ">
                                    <Field type="checkbox" name="menuSinTacc" className="mr-2" />
                                    <label className="mr-4">{traducciones.menuSinTacc}</label>
                                    <Field type="checkbox" name="menuVegano" className="mr-2" />
                                    <label>{traducciones.menuVegano}</label>
                                </div>
                            </div>
                            <div>
                                <label className="block font-semibold text-gray-700">{traducciones.comentarios}:</label>
                                <Field type="text" name="comentarios" className="w-full h-28 p-2 border rounded" />
                            </div>
                            <button type="submit" disabled={isSubmitting} className="w-full bg-blue-500 text-white p-2 rounded">{traducciones.enviar}</button>
                        </Form>
                    )}
                </Formik>
            </div>
        </>
    );
}

export default ReservaForm;