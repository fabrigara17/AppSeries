const formSerie = document.getElementById('form-serie');
const mensaje = document.getElementById('mensaje');
const boton = formSerie.querySelector('button[type="submit"]');

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];
const TAMANO_MAX = 2 * 1024 * 1024; // 2 MB, igual al límite del bucket

function mostrarMensaje(texto, tipo) {
    mensaje.textContent = texto;
    mensaje.className = `mensaje mensaje--${tipo}`;
}

function nombreSeguro(nombre) {
    const limpio = nombre
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${Date.now()}_${limpio}`;
}

formSerie.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. Captura
    const titulo = document.getElementById('titulo').value.trim();
    const genero = document.getElementById('genero').value;
    const puntuacion = parseFloat(document.getElementById('puntuacion').value);
    const resena = document.getElementById('resena').value.trim();
    const recomendada = document.getElementById('recomendada').checked;
    const userEmail = document.getElementById('user_email').value.trim().toLowerCase();
    const archivo = document.getElementById('imagen').files[0];

    // 2. Validación
    if (Number.isNaN(puntuacion) || puntuacion < 0 || puntuacion > 10) {
        mostrarMensaje('La puntuación debe ser un número entre 0 y 10.', 'error');
        return;
    }
    if (archivo) {
        if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
            mostrarMensaje('La portada debe ser JPG, PNG o WEBP.', 'error');
            return;
        }
        if (archivo.size > TAMANO_MAX) {
            mostrarMensaje('La portada no puede superar los 2 MB.', 'error');
            return;
        }
    }

    boton.disabled = true;
    mostrarMensaje('Guardando...', 'info');

    // 3. Subida de archivo (opcional)
    let imagenUrl = null;
    let nombreArchivo = null;

    if (archivo) {
        nombreArchivo = nombreSeguro(archivo.name);

        const { error: errorStorage } = await supabaseClient.storage
            .from('portadas')
            .upload(nombreArchivo, archivo, { cacheControl: '3600', upsert: false });

        if (errorStorage) {
            mostrarMensaje(`Error al subir la portada: ${errorStorage.message}`, 'error');
            boton.disabled = false;
            return;
        }

        const { data: urlData } = supabaseClient.storage
            .from('portadas')
            .getPublicUrl(nombreArchivo);

        imagenUrl = urlData.publicUrl;
    }

    // 4. Objeto a insertar
    const nuevaSerie = {
        titulo,
        genero,
        puntuacion,
        imagen_url: imagenUrl,
        resena: resena || null,
        recomendada,
        user_email: userEmail
    };

    // 5. Insert
    const { error } = await supabaseClient
        .from('series')
        .insert(nuevaSerie);

    if (error) {
        // No dejar la imagen huérfana en el bucket
        if (nombreArchivo) {
            await supabaseClient.storage.from('portadas').remove([nombreArchivo]);
        }
        mostrarMensaje(`Error al guardar la serie: ${error.message}`, 'error');
        boton.disabled = false;
        return;
    }

    mostrarMensaje('¡Serie guardada con éxito!', 'exito');
    formSerie.reset();
    boton.disabled = false;
});