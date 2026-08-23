import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react'

import {
  AlertTriangle,
  CheckCircle,
  CircleDollarSign,
  Clock3,
  Library,
  MapPin,
  Phone,
  QrCode,
  RefreshCw,
  Save,
  Settings as SettingsIcon,
  UserPen,
  Wallet
} from 'lucide-react'

import api from '../../api/axios'


// =====================================================
// KNOWN SETTINGS
// =====================================================

const SETTING_META = {

  library_name: {
    label: 'Library Name',
    description:
      'Public name of the library.',
    icon: Library,
    type: 'text'
  },

  library_address: {
    label: 'Library Address',
    description:
      'Address displayed in public library information.',
    icon: MapPin,
    type: 'text'
  },

  library_phone: {
    label: 'Library Phone',
    description:
      'Public contact phone number.',
    icon: Phone,
    type: 'text'
  },

  working_hours: {
    label: 'Working Hours',
    description:
      'Library opening and working hours.',
    icon: Clock3,
    type: 'text'
  },

  seat_reservation_price_per_seat: {
    label: 'Seat Reservation Price',
    description:
      'Price charged for one reserved seat.',
    icon: Wallet,
    type: 'number'
  },

  payment_qr_code: {
    label: 'Payment QR Code Path',
    description:
      'Storage path of the Sham Cash payment QR image.',
    icon: QrCode,
    type: 'text'
  }

}


// =====================================================
// COMPONENT
// =====================================================

const Settings = () => {

  // ===================================================
  // GENERAL SETTINGS
  // ===================================================

  const [settings, setSettings] =
    useState([])

  const [originalValues, setOriginalValues] =
    useState({})


  // ===================================================
  // AUTHOR REVENUE
  // ===================================================

  const [
    authorRevenuePercent,
    setAuthorRevenuePercent
  ] = useState('')

  const [
    originalAuthorRevenuePercent,
    setOriginalAuthorRevenuePercent
  ] = useState('')


  // ===================================================
  // PAGE STATE
  // ===================================================

  const [loading, setLoading] =
    useState(true)

  const [savingKey, setSavingKey] =
    useState(null)

  const [
    savingAuthorRevenue,
    setSavingAuthorRevenue
  ] = useState(false)

  const [message, setMessage] =
    useState('')

  const [messageType, setMessageType] =
    useState('success')

  const [fieldErrors, setFieldErrors] =
    useState({})


  // ===================================================
  // HELPERS
  // ===================================================

  const showMessage = (
    text,
    type = 'success'
  ) => {

    setMessage(text)
    setMessageType(type)

  }


  const getSettingLabel = key => {

    if (SETTING_META[key]) {
      return SETTING_META[key].label
    }


    return String(key || '')
      .replaceAll('_', ' ')
      .replace(/\b\w/g, char =>
        char.toUpperCase()
      )

  }


  const getUpdatedByName = setting => {

    return (
      setting?.updatedBy?.full_name ||
      setting?.updated_by?.full_name ||
      setting?.updated_by_user?.full_name ||
      null
    )

  }


  const getSettingIcon = key => {

    return (
      SETTING_META[key]?.icon ||
      SettingsIcon
    )

  }


  // ===================================================
  // QR IMAGE URL
  // ===================================================

  const getStorageUrl = path => {

    if (!path) {
      return null
    }


    if (
      path.startsWith('http://') ||
      path.startsWith('https://')
    ) {
      return path
    }


    const apiBase =
      api.defaults.baseURL || ''


    const appBase =
      apiBase.replace(/\/api\/?$/, '')


    return (
      `${appBase}/storage/` +
      path.replace(/^\/+/, '')
    )

  }


  // ===================================================
  // LOAD SETTINGS
  //
  // GET /admin/settings
  //
  // GET /admin/settings/author-revenue-percent
  // ===================================================

  const loadSettings = useCallback(
    async () => {

      setLoading(true)

      setMessage('')

      setFieldErrors({})


      const results =
        await Promise.allSettled([

          api.get(
            '/admin/settings'
          ),

          api.get(
            '/admin/settings/author-revenue-percent'
          )

        ])


      // ===============================================
      // GENERAL SETTINGS
      // ===============================================

      if (
        results[0].status ===
        'fulfilled'
      ) {

        const data =
          results[0]
            .value
            ?.data
            ?.data


        const rows =
          Array.isArray(data)
            ? data
            : []


        /*
          author_revenue_percent له Endpoint
          خاص، لذلك لا نعرضه مرتين.
        */

        const generalSettings =
          rows.filter(
            setting =>
              setting.key !==
              'author_revenue_percent'
          )


        setSettings(
          generalSettings.map(
            setting => ({
              ...setting,

              /*
                الـ input في React سيبقى
                دائمًا String.
              */
              value:
                setting.value ===
                null ||
                setting.value ===
                undefined

                  ? ''

                  : String(
                      setting.value
                    )
            })
          )
        )


        const originals = {}


        generalSettings.forEach(
          setting => {

            originals[setting.key] =

              setting.value ===
              null ||
              setting.value ===
              undefined

                ? ''

                : String(
                    setting.value
                  )

          }
        )


        setOriginalValues(
          originals
        )

      }

      else {

        console.error(
          'Settings loading error:',
          results[0].reason
        )


        showMessage(
          results[0]
            .reason
            ?.response
            ?.data
            ?.message ||
          'System settings could not be loaded.',
          'error'
        )

      }


      // ===============================================
      // AUTHOR REVENUE PERCENT
      // ===============================================

      if (
        results[1].status ===
        'fulfilled'
      ) {

        const percent =

          results[1]
            .value
            ?.data
            ?.data
            ?.author_revenue_percent


        const stringValue =

          percent === null ||
          percent === undefined

            ? ''

            : String(percent)


        setAuthorRevenuePercent(
          stringValue
        )


        setOriginalAuthorRevenuePercent(
          stringValue
        )

      }

      else {

        console.error(
          'Author revenue setting error:',
          results[1].reason
        )

      }


      setLoading(false)

    },
    []
  )


  // ===================================================
  // FIRST LOAD
  // ===================================================

  useEffect(() => {

    loadSettings()

  }, [loadSettings])


  // ===================================================
  // GENERAL SETTING CHANGE
  // ===================================================

  const handleSettingChange = (
    key,
    value
  ) => {

    setSettings(prev =>
      prev.map(setting =>

        setting.key === key

          ? {
              ...setting,
              value
            }

          : setting

      )
    )


    if (fieldErrors[key]) {

      setFieldErrors(prev => ({
        ...prev,
        [key]: undefined
      }))

    }

  }


  // ===================================================
  // SAVE GENERAL SETTING
  //
  // PUT /admin/settings/{key}
  //
  // IMPORTANT:
  // value MUST ALWAYS BE STRING
  // ===================================================

  const handleSaveSetting = async (
    setting
  ) => {

    const key =
      setting.key


    const stringValue =
      String(
        setting.value ?? ''
      )


    if (!stringValue.trim()) {

      setFieldErrors(prev => ({
        ...prev,

        [key]:
          'This value cannot be empty.'
      }))

      return
    }


    setSavingKey(key)

    setMessage('')


    try {

      const res = await api.put(
        `/admin/settings/${encodeURIComponent(key)}`,
        {
          /*
            Contract requirement:
            string always.
          */
          value: stringValue
        }
      )


      const returnedSetting =
        res.data?.data


      /*
        إذا رجع الباك Setting محدثًا
        نستفيد منه، وإلا نحافظ على القيمة.
      */

      setSettings(prev =>
        prev.map(item => {

          if (item.key !== key) {
            return item
          }


          return {

            ...item,

            ...(
              returnedSetting &&
              typeof returnedSetting ===
                'object'

                ? returnedSetting

                : {}
            ),

            value: stringValue

          }

        })
      )


      setOriginalValues(prev => ({
        ...prev,
        [key]: stringValue
      }))


      showMessage(
        res.data?.message ||
        `${getSettingLabel(key)} saved successfully.`
      )

    }

    catch (err) {

      console.error(
        'Save setting error:',
        err
      )


      if (
        err.response?.status === 422 &&
        err.response?.data?.errors
      ) {

        const firstError =

          err.response
            .data
            .errors
            ?.value?.[0]


        if (firstError) {

          setFieldErrors(prev => ({
            ...prev,
            [key]: firstError
          }))

        }

      }


      showMessage(
        err.response?.data?.message ||
        'The setting could not be saved.',
        'error'
      )

    }

    finally {

      setSavingKey(null)

    }

  }


  // ===================================================
  // AUTHOR REVENUE PERCENT
  //
  // PUT
  // /admin/settings/author-revenue-percent
  //
  // Body:
  // {
  //   value: numeric 0-100
  // }
  // ===================================================

  const handleSaveAuthorRevenue =
    async () => {

      const value =
        Number(
          authorRevenuePercent
        )


      if (
        authorRevenuePercent === '' ||
        Number.isNaN(value)
      ) {

        setFieldErrors(prev => ({
          ...prev,

          author_revenue_percent:
            'A valid percentage is required.'
        }))

        return
      }


      if (
        value < 0 ||
        value > 100
      ) {

        setFieldErrors(prev => ({
          ...prev,

          author_revenue_percent:
            'Percentage must be between 0 and 100.'
        }))

        return
      }


      setSavingAuthorRevenue(true)

      setMessage('')


      try {

        const res = await api.put(
          '/admin/settings/author-revenue-percent',
          {
            value
          }
        )


        const returnedValue =

          res.data
            ?.data
            ?.author_revenue_percent


        const finalValue =

          returnedValue ===
          null ||
          returnedValue ===
          undefined

            ? String(value)

            : String(
                returnedValue
              )


        setAuthorRevenuePercent(
          finalValue
        )


        setOriginalAuthorRevenuePercent(
          finalValue
        )


        showMessage(
          res.data?.message ||
          'Author revenue percentage saved successfully.'
        )

      }

      catch (err) {

        console.error(
          'Author revenue update error:',
          err
        )


        if (
          err.response?.status === 422 &&
          err.response?.data?.errors
        ) {

          const firstError =

            err.response
              .data
              .errors
              ?.value?.[0]


          if (firstError) {

            setFieldErrors(prev => ({
              ...prev,

              author_revenue_percent:
                firstError
            }))

          }

        }


        showMessage(
          err.response?.data?.message ||
          'Author revenue percentage could not be saved.',
          'error'
        )

      }

      finally {

        setSavingAuthorRevenue(false)

      }

    }


  // ===================================================
  // DIRTY SETTINGS COUNT
  // ===================================================

  const changedSettingsCount =
    useMemo(() => {

      let count = 0


      settings.forEach(setting => {

        if (
          String(
            setting.value ?? ''
          ) !==
          String(
            originalValues[
              setting.key
            ] ?? ''
          )
        ) {

          count += 1

        }

      })


      if (
        String(
          authorRevenuePercent
        ) !==
        String(
          originalAuthorRevenuePercent
        )
      ) {

        count += 1

      }


      return count

    }, [
      settings,
      originalValues,
      authorRevenuePercent,
      originalAuthorRevenuePercent
    ])


  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {

    return (

      <div className='min-h-[65vh] flex flex-col justify-center items-center gap-3 text-[#122F21]'>

        <RefreshCw
          size={36}
          className='animate-spin'
        />

        <p className='font-medium'>

          Loading settings...

        </p>

      </div>

    )

  }


  // ===================================================
  // JSX
  // ===================================================

  return (

    <div className='w-full flex flex-col gap-6 pb-10'>


      {/* =============================================
          HEADER
      ============================================== */}

      <div className='flex flex-col md:flex-row gap-4 md:items-center md:justify-between'>


        <div>
 


          <p className='text-sm text-[#122F21]/60 mt-1'>

            Manage public library information,
            reservation pricing and author revenue.

          </p>

        </div>


        <div className='flex items-center gap-3'>


          {changedSettingsCount > 0 && (

            <span className='bg-yellow-100 text-yellow-800 px-3 py-2 rounded-xl text-sm font-medium'>

              {changedSettingsCount}
              {' '}
              unsaved change
              {
                changedSettingsCount > 1
                  ? 's'
                  : ''
              }

            </span>

          )}


          <button
            type='button'
            onClick={loadSettings}
            disabled={
              savingKey !== null ||
              savingAuthorRevenue
            }
            className='flex items-center gap-2 bg-[#122F21] text-white px-4 py-2 rounded-xl cursor-pointer disabled:opacity-50'
          >

            <RefreshCw size={17} />

            Reload

          </button>

        </div>

      </div>


      {/* =============================================
          MESSAGE
      ============================================== */}

      {message && (

        <div
          className={`
            rounded-xl
            p-4
            flex
            items-center
            gap-3

            ${
              messageType === 'error'

                ? 'bg-red-100 text-red-800'

                : 'bg-green-100 text-green-800'
            }
          `}
        >

          {
            messageType === 'error'

              ? (
                <AlertTriangle
                  size={20}
                />
              )

              : (
                <CheckCircle
                  size={20}
                />
              )
          }

          <span>
            {message}
          </span>

        </div>

      )}


      {/* =============================================
          AUTHOR REVENUE
      ============================================== */}

      <div className='bg-[#AAC3AD] rounded-2xl shadow-md overflow-hidden'>


        <div className='p-5 border-b border-[#122F21]/10 flex items-center gap-3'>

          <div className='bg-[#F09A79] p-3 rounded-xl'>

            <UserPen size={23} />

          </div>


          <div>

            <h2 className='text-xl font-bold text-[#122F21]'>

              Author Revenue Percentage

            </h2>


            <p className='text-sm text-[#122F21]/60 mt-1'>

              Percentage of eligible revenue allocated to authors.

            </p>

          </div>

        </div>


        <div className='p-5'>


          <div className='max-w-xl'>


            <label className='block text-sm font-bold text-[#122F21] mb-2'>

              Author Revenue %

            </label>


            <div className='flex flex-col sm:flex-row gap-2'>


              <div className='relative flex-1'>

                <CircleDollarSign
                  size={18}
                  className='absolute left-3 top-1/2 -translate-y-1/2 text-[#122F21]/60'
                />


                <input
                  type='number'
                  min='0'
                  max='100'
                  step='0.01'
                  value={
                    authorRevenuePercent
                  }
                  onChange={event => {

                    setAuthorRevenuePercent(
                      event.target.value
                    )


                    setFieldErrors(prev => ({
                      ...prev,

                      author_revenue_percent:
                        undefined
                    }))

                  }}
                  className='w-full bg-[#F6EFC5] rounded-xl py-3 pl-10 pr-4 outline-none'
                />

              </div>


              <button
                type='button'
                disabled={
                  savingAuthorRevenue ||
                  String(
                    authorRevenuePercent
                  ) ===
                  String(
                    originalAuthorRevenuePercent
                  )
                }
                onClick={
                  handleSaveAuthorRevenue
                }
                className='flex items-center justify-center gap-2 bg-[#122F21] text-white px-5 py-3 rounded-xl cursor-pointer disabled:opacity-40'
              >

                {
                  savingAuthorRevenue

                    ? (
                      <RefreshCw
                        size={17}
                        className='animate-spin'
                      />
                    )

                    : (
                      <Save size={17} />
                    )
                }

                Save

              </button>

            </div>


            <FieldError
              error={
                fieldErrors
                  .author_revenue_percent
              }
            />


            <div className='bg-[#F6EFC5] rounded-xl p-4 mt-4 text-sm text-[#122F21]'>

              <p className='font-bold'>

                Important

              </p>


              <p className='mt-1 leading-6 opacity-70'>

                Changing this percentage affects future
                operations only. Previous sales and
                borrowings keep the revenue percentage
                that was stored with them when the
                operation was completed.

              </p>

            </div>

          </div>

        </div>

      </div>


      {/* =============================================
          GENERAL SETTINGS
      ============================================== */}

      <div>


        <div className='mb-4'>

          <h2 className='text-xl font-bold text-[#122F21]'>

            General Settings

          </h2>


          <p className='text-sm text-[#122F21]/60 mt-1'>

            Each setting is saved independently.

          </p>

        </div>


        {settings.length === 0 ? (

          <div className='bg-[#AAC3AD] rounded-2xl p-10 text-center text-[#122F21]/60'>

            There are no general settings.

          </div>

        ) : (

          <div className='grid grid-cols-1 xl:grid-cols-2 gap-4'>


            {settings.map(setting => {

              const meta =
                SETTING_META[
                  setting.key
                ]

              const Icon =
                getSettingIcon(
                  setting.key
                )


              const changed =

                String(
                  setting.value ?? ''
                ) !==
                String(
                  originalValues[
                    setting.key
                  ] ?? ''
                )


              const updatedBy =
                getUpdatedByName(
                  setting
                )


              return (

                <div
                  key={
                    setting.key
                  }
                  className='bg-[#AAC3AD] rounded-2xl shadow-md p-5'
                >


                  {/* CARD HEADER */}

                  <div className='flex gap-3 items-start'>


                    <div className='bg-[#F09A79] p-3 rounded-xl shrink-0'>

                      <Icon size={21} />

                    </div>


                    <div className='flex-1'>

                      <div className='flex items-center gap-2 flex-wrap'>


                        <h3 className='font-bold text-[#122F21]'>

                          {
                            getSettingLabel(
                              setting.key
                            )
                          }

                        </h3>


                        {changed && (

                          <span className='bg-yellow-100 text-yellow-800 rounded-full px-2 py-1 text-xs'>

                            Unsaved

                          </span>

                        )}

                      </div>


                      <p className='text-xs text-[#122F21]/60 mt-1'>

                        {
                          meta?.description ||
                          `System setting: ${setting.key}`
                        }

                      </p>

                    </div>

                  </div>


                  {/* INPUT */}

                  <div className='mt-5'>


                    <input
                      type={
                        meta?.type ||
                        'text'
                      }
                      value={
                        setting.value ??
                        ''
                      }
                      onChange={event =>
                        handleSettingChange(
                          setting.key,
                          event.target.value
                        )
                      }
                      className='w-full bg-[#F6EFC5] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#122F21]'
                    />


                    <FieldError
                      error={
                        fieldErrors[
                          setting.key
                        ]
                      }
                    />

                  </div>


                  {/* QR PREVIEW */}

                  {
                    setting.key ===
                    'payment_qr_code' &&
                    setting.value &&
                    (

                      <div className='mt-4 bg-[#F6EFC5] rounded-xl p-4'>


                        <p className='text-xs text-[#122F21]/60 mb-3'>

                          Current QR Preview

                        </p>


                        <img
                          src={
                            getStorageUrl(
                              setting.value
                            )
                          }
                          alt='Payment QR'
                          className='w-36 h-36 object-contain rounded-xl bg-white'
                          onError={event => {

                            event.currentTarget
                              .style
                              .display =
                              'none'

                          }}
                        />


                        <p className='text-xs text-[#122F21]/50 mt-3 break-all'>

                          {setting.value}

                        </p>

                      </div>

                    )
                  }


                  {/* FOOTER */}

                  <div className='flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center mt-5'>


                    <div className='text-xs text-[#122F21]/50'>


                      {updatedBy && (

                        <p>

                          Last updated by:
                          {' '}
                          <strong>
                            {updatedBy}
                          </strong>

                        </p>

                      )}


                      {setting.updated_at && (

                        <p className='mt-1'>

                          {
                            new Date(
                              setting.updated_at
                            ).toLocaleString()
                          }

                        </p>

                      )}

                    </div>


                    <button
                      type='button'
                      disabled={
                        savingKey ===
                          setting.key ||
                        !changed
                      }
                      onClick={() =>
                        handleSaveSetting(
                          setting
                        )
                      }
                      className='flex items-center justify-center gap-2 bg-[#122F21] text-white px-4 py-2 rounded-xl cursor-pointer disabled:opacity-40'
                    >

                      {
                        savingKey ===
                        setting.key

                          ? (
                            <RefreshCw
                              size={16}
                              className='animate-spin'
                            />
                          )

                          : (
                            <Save size={16} />
                          )
                      }

                      Save

                    </button>

                  </div>

                </div>

              )

            })}

          </div>

        )}

      </div>


      {/* =============================================
          BACKEND CONTRACT NOTE
      ============================================== */}

      
    </div>

  )

}


// =====================================================
// FIELD ERROR
// =====================================================

const FieldError = ({
  error
}) => {

  if (!error) {
    return null
  }


  const text =
    Array.isArray(error)
      ? error[0]
      : error


  return (

    <p className='text-red-700 text-xs mt-1'>

      {text}

    </p>

  )

}


export default Settings