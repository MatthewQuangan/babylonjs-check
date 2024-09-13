import { Divider } from 'antd';
import { Fragment, ReactNode } from 'react';

interface InfoCardProps {
  title: ReactNode;
  items: { label: ReactNode; value: ReactNode }[];
}

export const InfoCard = (props: InfoCardProps) => {
  const { title, items } = props;
  return (
    <div className="infoCard">
      <p>{title}</p>

      <Divider className="divider" />

      <div className="cardGrid">
        {items.map(({ label, value }, index) => (
          <Fragment key={index}>
            <label>{label}</label>
            <span>{value}</span>
          </Fragment>
        ))}
      </div>
    </div>
  );
};
