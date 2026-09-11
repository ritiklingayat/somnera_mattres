import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getAdminDistributorRequestsApi,
} from '../services/adminService';


function formatDate(
  value,
) {

  if (!value) {

    return '—';
  }


  const date =
    new Date(
      value,
    );


  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {

    return value;
  }


  return date.toLocaleString(
    'en-IN',
    {
      day:
        'numeric',

      month:
        'short',

      year:
        'numeric',

      hour:
        '2-digit',

      minute:
        '2-digit',
    },
  );
}


export default function LeadsPage() {

  const [
    leads,
    setLeads,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState('');


  const [
    query,
    setQuery,
  ] = useState('');


  /*
  ================================================
  LOAD DISTRIBUTOR REQUESTS
  ================================================
  */

  useEffect(() => {

    let active =
      true;


    const loadLeads =
      async () => {

        try {

          setLoading(
            true,
          );


          setError('');


          const result =
            await getAdminDistributorRequestsApi();


          if (
            active
          ) {

            setLeads(
              result,
            );
          }


        } catch (error) {

          if (
            active
          ) {

            setError(
              error.message ||
              'Unable to load distributor requests.',
            );
          }


        } finally {

          if (
            active
          ) {

            setLoading(
              false,
            );
          }
        }
      };


    loadLeads();


    return () => {

      active =
        false;
    };

  }, []);


  /*
  ================================================
  SEARCH
  ================================================
  */

  const filteredLeads =
    useMemo(() => {

      const search =
        query
          .trim()
          .toLowerCase();


      if (!search) {

        return leads;
      }


      return leads.filter(
        (lead) => {

          const text =
            `
              ${lead.id || ''}
              ${lead.fullName || ''}
              ${lead.email || ''}
              ${lead.phoneNumber || ''}
              ${lead.targetLocation || ''}
              ${lead.investmentRange || ''}
              ${lead.businessExperience || ''}
            `
              .toLowerCase();


          return text.includes(
            search,
          );
        },
      );

    }, [
      leads,
      query,
    ]);


  /*
  ================================================
  UI
  ================================================
  */

  return (

    <>

      <div className="admin-title">

        <div>

          <p>
            Distributor enquiries
          </p>


          <h1>
            Leads
          </h1>

        </div>


        <div
          style={{
            fontWeight:
              700,
          }}
        >

          Total Leads:
          {' '}

          {
            leads.length
          }

        </div>

      </div>


      <section className="admin-card">

        <div className="order-toolbar">

          <input
            type="search"
            value={
              query
            }
            onChange={
              (event) =>
                setQuery(
                  event.target.value,
                )
            }
            placeholder="Search by name, email, mobile or location"
          />

        </div>


        {
          loading
            ? (

              <div
                style={{
                  padding:
                    '40px',

                  textAlign:
                    'center',
                }}
              >
                Loading distributor requests...
              </div>
            )

            : error
              ? (

                <div
                  style={{
                    padding:
                      '40px',

                    textAlign:
                      'center',
                  }}
                >

                  <strong>
                    Unable to load leads
                  </strong>


                  <p>
                    {
                      error
                    }
                  </p>

                </div>
              )

              : filteredLeads.length ===
                0
                ? (

                  <div
                    style={{
                      padding:
                        '40px',

                      textAlign:
                        'center',
                    }}
                  >

                    <h2>
                      No distributor requests found
                    </h2>


                    <p>
                      New distributor partnership submissions will appear here.
                    </p>

                  </div>
                )

                : (

                  <div className="order-table">

                    <div className="table-head">

                      <span>
                        Applicant
                      </span>

                      <span>
                        Contact
                      </span>

                      <span>
                        Location
                      </span>

                      <span>
                        Investment
                      </span>

                      <span>
                        Submitted
                      </span>

                    </div>


                    {
                      filteredLeads.map(
                        (lead) => (

                          <div
                            className="table-row"
                            key={
                              lead.id
                            }
                          >

                            <span>

                              <b>
                                {
                                  lead.fullName
                                }
                              </b>


                              <small>

                                Lead #
                                {
                                  lead.id
                                }

                              </small>

                            </span>


                            <span>

                              {
                                lead.email
                              }


                              <small>
                                {
                                  lead.phoneNumber
                                }
                              </small>

                            </span>


                            <span>

                              {
                                lead.targetLocation
                              }

                            </span>


                            <span>

                              <strong>
                                {
                                  lead.investmentRange
                                }
                              </strong>

                            </span>


                            <span>

                              {
                                formatDate(
                                  lead.createdAt,
                                )
                              }

                            </span>

                          </div>
                        ),
                      )
                    }

                  </div>
                )
        }


        {
          filteredLeads.length >
            0 && (

            <div
              style={{
                marginTop:
                  '24px',
              }}
            >

              {
                filteredLeads.map(
                  (lead) => (

                    <details
                      key={
                        `details-${lead.id}`
                      }
                      style={{
                        marginBottom:
                          '12px',

                        padding:
                          '14px',

                        border:
                          '1px solid #e5e7eb',

                        borderRadius:
                          '10px',
                      }}
                    >

                      <summary
                        style={{
                          cursor:
                            'pointer',

                          fontWeight:
                            700,
                        }}
                      >

                        View business experience —
                        {' '}

                        {
                          lead.fullName
                        }

                      </summary>


                      <p
                        style={{
                          marginTop:
                            '12px',

                          whiteSpace:
                            'pre-wrap',
                        }}
                      >

                        {
                          lead.businessExperience ||
                          'No experience details provided.'
                        }

                      </p>

                    </details>
                  ),
                )
              }

            </div>
          )
        }

      </section>

    </>
  );
}