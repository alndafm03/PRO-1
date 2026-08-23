import axios from 'axios'


// =====================================================
// API BASE URL
// =====================================================
//
// .env example:
//
// VITE_API_URL=http://127.0.0.1:8000/api
//
// Production example:
//
// VITE_API_URL=https://your-backend.com/api
//
// IMPORTANT:
// يجب أن يتضمن الرابط /api
// =====================================================

const rawBaseURL =
  import.meta.env.VITE_API_URL?.trim() ||
  'http://127.0.0.1:8000/api'


const baseURL =
  rawBaseURL.replace(/\/+$/, '')


// =====================================================
// AXIOS INSTANCE
// =====================================================

const api = axios.create({

  baseURL,

  /*
    Accept إلزامي حسب Backend Contract.

    لا نضع Content-Type هنا بشكل ثابت لأن
    بعض طلبات المشروع تستعمل FormData.
  */

  headers: {
    Accept: 'application/json'
  }

})


// =====================================================
// REQUEST INTERCEPTOR
// =====================================================
//
// - يضيف Bearer Token
// - يضمن Accept JSON
// - JSON requests => application/json
// - FormData => يترك Browser/Axios يضع
//   multipart/form-data مع boundary الصحيح
// =====================================================

api.interceptors.request.use(

  config => {

    // -----------------------------------------------
    // ENSURE HEADERS EXIST
    // -----------------------------------------------

    config.headers =
      config.headers || {}


    // -----------------------------------------------
    // ACCEPT JSON
    // -----------------------------------------------

    if (
      typeof config.headers.set ===
      'function'
    ) {

      config.headers.set(
        'Accept',
        'application/json'
      )

    }

    else {

      config.headers.Accept =
        'application/json'

    }


    // -----------------------------------------------
    // TOKEN
    // -----------------------------------------------

    const token =
      sessionStorage.getItem(
        'token'
      )


    if (token) {

      if (
        typeof config.headers.set ===
        'function'
      ) {

        config.headers.set(
          'Authorization',
          `Bearer ${token}`
        )

      }

      else {

        config.headers.Authorization =
          `Bearer ${token}`

      }

    }


    // -----------------------------------------------
    // CONTENT TYPE
    // -----------------------------------------------

    const isFormData =

      typeof FormData !==
        'undefined' &&

      config.data instanceof
        FormData


    if (isFormData) {

      /*
        مهم جدًا:

        لا نكتب:
        multipart/form-data

        يدويًا لأن المتصفح يجب أن يضيف
        boundary تلقائيًا.
      */

      if (
        typeof config.headers.delete ===
        'function'
      ) {

        config.headers.delete(
          'Content-Type'
        )

      }

      else {

        delete config.headers[
          'Content-Type'
        ]

      }

    }

    else {

      /*
        طلبات JSON العادية.
      */

      if (
        typeof config.headers.set ===
        'function'
      ) {

        if (
          !config.headers.get(
            'Content-Type'
          )
        ) {

          config.headers.set(
            'Content-Type',
            'application/json'
          )

        }

      }

      else if (
        !config.headers[
          'Content-Type'
        ]
      ) {

        config.headers[
          'Content-Type'
        ] =
          'application/json'

      }

    }


    return config

  },

  error => {

    return Promise.reject(
      error
    )

  }

)


// =====================================================
// RESPONSE INTERCEPTOR
// =====================================================
//
// 401:
// token missing / invalid / revoked
//
// نمسح جلسة الفرونت ونرجع Login.
//
// 403:
// لا نعمل redirect هنا.
// نترك الصفحة تعرض رسالة "غير مصرح".
//
// 422:
// نترك الصفحة تتعامل مع validation.
//
// 500:
// نترك الصفحة تعرض رسالة السيرفر.
// =====================================================

api.interceptors.response.use(

  response => response,

  error => {

    const status =
      error.response?.status


    const requestUrl =
      error.config?.url || ''


    // -----------------------------------------------
    // LOGIN REQUEST
    // -----------------------------------------------
    //
    // POST /auth/login يمكن أن يرجع 401
    // عند كلمة مرور خاطئة.
    //
    // لا نريد interceptor أن يعتبر ذلك
    // Session Expired.
    // -----------------------------------------------

    const isLoginRequest =
      requestUrl.includes(
        '/auth/login'
      )


    // -----------------------------------------------
    // UNAUTHORIZED
    // -----------------------------------------------

    if (
      status === 401 &&
      !isLoginRequest
    ) {

      /*
        نمسح فقط مفاتيح المصادقة الخاصة
        بالمشروع بدل sessionStorage.clear()
        حتى لا نحذف أي بيانات Session
        أخرى قد تضاف مستقبلًا.
      */

      sessionStorage.removeItem(
        'token'
      )

      sessionStorage.removeItem(
        'isLoggedIn'
      )

      sessionStorage.removeItem(
        'role'
      )


      sessionStorage.removeItem(
        'roles'
      )

      /*
        نحن خارج React Component،
        لذلك لا نستطيع استخدام useNavigate.

        window.location.replace مناسب هنا
        ويمنع الرجوع لصفحة محمية بتوكن منتهي.
      */

      if (
        window.location.pathname !==
        '/login'
      ) {

        window.location.replace(
          '/login'
        )

      }

    }


    return Promise.reject(
      error
    )

  }

)


export default api