import moment from 'moment';

export default class time
{
    static database_date(date?: string)
    {
        if (!date)
        {
            return null;
        }

        return moment(date)
            .startOf('day')
            .format(
                'YYYY-MM-DD HH:mm:ss'
            );
    }
}