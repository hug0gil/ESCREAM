<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Symfony\Component\HttpFoundation\Response;

class ApiFormRequest extends FormRequest
{
    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json([
            "message" => "Error in the validation",
            "errors" => $validator->errors()
        ], Response::HTTP_UNPROCESSABLE_ENTITY));
    }

    /*
    Cuando tienes ese método failedValidation sobrescrito y 
    lanzas explícitamente una excepción con una respuesta JSON, Laravel no se basa en 
    el header Accept para decidir cómo responder.Porque tú estás forzando que la respuesta 
    sea JSON siempre que falle la validación. 

    Sobrescribimos failedValidation para forzar siempre respuestas JSON,
    garantizando consistencia en la API, evitando redirecciones y facilitando
    que frontends o apps móviles manejen los errores de validación.
    */
}
